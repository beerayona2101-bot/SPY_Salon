'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketUrl } from '@/lib/api';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const { user, token } = useAuth();

  // Initialize single persistent Socket.IO connection on mount
  useEffect(() => {
    const targetSocketUrl = getSocketUrl();
    const socketInstance = io(targetSocketUrl, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: true,
      auth: (cb) => {
        cb({ token: typeof window !== 'undefined' ? localStorage.getItem('spy_token') : null });
      }
    });

    socketInstance.on('connect', () => {
      console.log('[SocketContext] Real-time WebSocket connected:', socketInstance.id);
      setIsConnected(true);
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('spy_token') : null;
      if (currentToken) {
        socketInstance.emit('authenticate', currentToken);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[SocketContext] Real-time WebSocket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []); // Run once on mount to prevent unnecessary reconnect cycles

  // Re-auth socket whenever authorization token updates (e.g. login, logout, or background refresh)
  useEffect(() => {
    if (!socket) return;
    socket.auth = { token };
    if (socket.connected) {
      if (token) {
        socket.emit('authenticate', token);
      }
    }
  }, [token, socket]);

  // Join rooms dynamically when user session is loaded or updated
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    if (user.role) {
      socket.emit('join_room', `room:${user.role}`);
    }
    const userId = user.id || (user as any)._id;
    if (userId) {
      socket.emit('join_room', `room:user_${userId}`);
    }
  }, [socket, isConnected, user?.role, (user as any)?._id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
