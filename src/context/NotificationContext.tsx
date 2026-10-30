import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { NotificationItem } from '../types';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
} from '../services/api';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationsApi();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [loadNotifications, isAuthenticated]);

  // Connect to socket and listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    let socket: Socket | null = null;
    try {
      socket = io({
        path: '/socket.io',
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        socket?.emit('join_user', user.id);
      });

      socket.on('notification', (newNotif: any) => {
        const item: NotificationItem = {
          id: newNotif._id || newNotif.id || `notif-${Date.now()}`,
          type: newNotif.type || 'system',
          title: newNotif.title,
          body: newNotif.body,
          meta: newNotif.meta,
          read: false,
          createdAt: newNotif.createdAt || new Date().toISOString(),
        };

        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    } catch (err) {
      console.warn('Notification socket error:', err);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user?.id]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationReadApi(id);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsReadApi();
  };

  const deleteNotification = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    await deleteNotificationApi(id);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
