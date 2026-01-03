import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

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

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinMessage,
  ) {
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
