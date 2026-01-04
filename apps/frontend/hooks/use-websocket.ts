'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

interface LockEvent {
  type: 'lock:acquired' | 'lock:released';
  projectId: string;
  lockedBy?: string;
  lockedAt?: string;
}

export function useWebSocket(projectId?: string, apiKey?: string) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

    const socket = io(wsUrl, {
      auth: { apiKey },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;
    setStatus('connecting');

    socket.on('connect', () => {
      setStatus('connected');
      if (projectId) {
        socket.emit('join', { projectId });
      }
    });

    socket.on('lock:acquired', (data: LockEvent) => {
      queryClient.invalidateQueries({ queryKey: ['lock', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    socket.on('lock:released', (data: LockEvent) => {
      queryClient.invalidateQueries({ queryKey: ['lock', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });

    socket.on('doc:updated', () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['docs', projectId] });
      }
    });

    socket.on('error', (error: { message: string }) => {
      console.warn('WebSocket error:', error.message);
    });

    socket.on('connect_error', () => {
      setStatus('disconnected');
    });

    socket.on('disconnect', () => {
      setStatus('disconnected');
    });
  }, [projectId, apiKey, queryClient]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect]);

  const send = useCallback((event: string, data: object) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { status, send };
}
