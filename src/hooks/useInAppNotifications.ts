import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification as deleteNotificationUtil,
  createNotification as createNotificationUtil,
  type Notification 
} from '../utils/notificationUtils';

export const useInAppNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);


  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => getNotifications(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read_at).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Real-time subscription for new notifications
  useEffect(() => {
    console.log('[notifications] effect running, user.id:', user?.id);
    if (!user?.id) {
      console.log('[notifications] skip realtime setup: no user id');
      return;
    }

    const key = ['notifications', user.id];
    console.log('[notifications] setting up realtime for', user.id);

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[notifications] INSERT', payload.new);
          queryClient.setQueryData<Notification[]>(key, (prev = []) => {
            const next = [payload.new as Notification, ...prev];
            const seen = new Set<string>();
            return next.filter(n => {
              const id = String(n.id);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[notifications] UPDATE', payload.new);
          queryClient.setQueryData<Notification[]>(key, (prev = []) =>
            prev.map(n => (String(n.id) === String(payload.new.id) ? (payload.new as Notification) : n))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          console.log('[notifications] DELETE', payload.old);
          queryClient.setQueryData<Notification[]>(key, (prev = []) =>
            prev.filter(n => String(n.id) !== String(payload.old.id))
          );
        }
      )
      .subscribe((status) => {
        console.log('[notifications] channel status', status);
      });

    return () => {
      console.log('[notifications] removing channel for user:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // React Query mutations for notification actions
  const invalidate = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  };

  const createMyNotificationMutation = useMutation({
    mutationFn: async (args: { title: string; message: string; type: string; eventId?: number; data?: any }) => {
      if (!user?.id) throw new Error('No user');
      return createNotificationUtil(
        user.id,
        args.title,
        args.message,
        args.type,
        args.eventId,
        args.data
      );
    },
    onSuccess: invalidate,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: invalidate,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      return markAllNotificationsAsRead(user.id);
    },
    onSuccess: invalidate,
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotificationUtil(notificationId),
    onSuccess: invalidate,
  });

  // Convenience wrappers
  const createNotification = (args: { title: string; message: string; type: string; eventId?: number; data?: any }) =>
    createMyNotificationMutation.mutateAsync(args);

  const markAsRead = (notificationId: string) => markAsReadMutation.mutateAsync(notificationId);

  const markAllAsRead = () => markAllAsReadMutation.mutateAsync();

  const deleteNotification = (notificationId: string) => deleteNotificationMutation.mutateAsync(notificationId);

  return {
    notifications,
    isLoading,
    error,
    unreadCount,
    // actions
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,

    // optional mutation state flags
    creating: createMyNotificationMutation.isPending,
    markingAsRead: markAsReadMutation.isPending,
    markingAllAsRead: markAllAsReadMutation.isPending,
    deleting: deleteNotificationMutation.isPending,
  };
}; 