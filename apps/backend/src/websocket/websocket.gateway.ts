import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

interface JoinMessage {
  projectId: string;
}

interface LockEvent {
  type: 'lock:acquired' | 'lock:released';
  projectId: string;
  lockedBy?: string;
  lockedAt?: string;
}

interface DocEvent {
  type: 'doc:updated';
  projectId: string;
  docId: string;
  hash: string;
}

// CUID pattern validation
const CUID_PATTERN = /^c[a-z0-9]{24}$/;

function isValidCuid(id: string): boolean {
  return CUID_PATTERN.test(id);
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger('WebSocketGateway');

  constructor(private prisma: PrismaService) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    try {
      // Allow unauthenticated connections in development for web UI
      const isDev = process.env.NODE_ENV !== 'production';

      // Validate API key from handshake auth or query
      const apiKey =
        client.handshake.auth?.apiKey ||
        client.handshake.headers['x-api-key'] ||
        client.handshake.query?.apiKey;

      if (!apiKey) {
        if (isDev) {
          // Allow unauthenticated connections in dev mode for web UI
          client.data.authenticated = false;
          client.data.devMode = true;
          this.logger.log(`Client ${client.id} connected (dev mode, no auth)`);
          return;
        }
        this.logger.warn(`Client ${client.id} rejected: no API key`);
        client.emit('error', { message: 'API key required' });
        client.disconnect();
        return;
      }

      // Validate API key
      const key = await this.prisma.apiKey.findUnique({
        where: { key: String(apiKey) },
        include: { project: true },
      });

      if (!key || !key.isActive) {
        this.logger.warn(`Client ${client.id} rejected: invalid API key`);
        client.emit('error', { message: 'Invalid or inactive API key' });
        client.disconnect();
        return;
      }

      // Store project info in socket data
      client.data.projectId = key.projectId;
      client.data.authenticated = true;

      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      this.logger.error(`Connection error for ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
    // In dev mode, allow joining any project room
    if (client.data.devMode) {
      if (!data.projectId || !isValidCuid(data.projectId)) {
        throw new WsException('Invalid projectId format');
      }
      const room = `project:${data.projectId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room} (dev mode)`);
      return { success: true, room };
    }

    // Validate authentication
    if (!client.data.authenticated) {
      throw new WsException('Not authenticated');
    }

    // Validate projectId format
    if (!data.projectId || !isValidCuid(data.projectId)) {
      throw new WsException('Invalid projectId format');
    }

    // Only allow joining rooms for authenticated project
    if (client.data.projectId !== data.projectId) {
      throw new WsException('Cannot join room for different project');
    }

    const room = `project:${data.projectId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('leave')
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
    // Validate projectId format
    if (!data.projectId || !isValidCuid(data.projectId)) {
      throw new WsException('Invalid projectId format');
    }

    const room = `project:${data.projectId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { success: true };
  }

  /**
   * Broadcast lock acquired event to all clients in project room
   */
  notifyLockAcquired(projectId: string, lockedBy: string, lockedAt: string) {
    const event: LockEvent = {
      type: 'lock:acquired',
      projectId,
      lockedBy,
      lockedAt,
    };
    this.server.to(`project:${projectId}`).emit('lock:acquired', event);
    this.logger.log(`Lock acquired broadcast for project ${projectId}`);
  }

  /**
   * Broadcast lock released event to all clients in project room
   */
  notifyLockReleased(projectId: string) {
    const event: LockEvent = {
      type: 'lock:released',
      projectId,
    };
    this.server.to(`project:${projectId}`).emit('lock:released', event);
    this.logger.log(`Lock released broadcast for project ${projectId}`);
  }

  /**
   * Broadcast doc updated event to all clients in project room
   */
  notifyDocUpdated(projectId: string, docId: string, hash: string) {
    const event: DocEvent = {
      type: 'doc:updated',
      projectId,
      docId,
      hash,
    };
    this.server.to(`project:${projectId}`).emit('doc:updated', event);
    this.logger.log(`Doc updated broadcast for project ${projectId}`);
  }
}
