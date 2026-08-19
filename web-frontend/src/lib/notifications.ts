import { QueryClient } from '@tanstack/react-query';

export type Notification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export function pushNotification(queryClient: QueryClient, userId: string | undefined, notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  if (!userId) return;
  const key = ['notifications', userId];
  const list = (queryClient.getQueryData<Notification[]>(key) ?? []) as Notification[];
  const newNotif: Notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type: notif.type,
    message: notif.message,
    timestamp: new Date().toISOString(),
    read: false,
  };
  queryClient.setQueryData(key, [newNotif, ...list]);
}

export function getNotifications(queryClient: QueryClient, userId: string | undefined) {
  if (!userId) return [] as Notification[];
  return (queryClient.getQueryData<Notification[]>(['notifications', userId]) ?? []) as Notification[];
}
