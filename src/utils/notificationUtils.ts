import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  event_id?: number;
  read_at?: string;
  created_at: string;
  data?: any;
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  eventId?: number,
  data?: any
): Promise<{ notification: Notification | null; error: any }> => {
  console.log('Creating notification:', { userId, title, message, type, eventId, data });
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title,
      message,
      type,
      event_id: eventId,
      data
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
  } else {
    console.log('Notification created successfully:', notification);
  }

  return { notification: notification as Notification | null, error };
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return (data || []) as Notification[];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
  }
};

// Specific notification creators
export const notifyEventAssignment = async (eventId: number, assignedUserId: string, eventName: string) => {
  console.log('notifyEventAssignment called:', { eventId, assignedUserId, eventName });
  
  // Fetch event details to get date and time
  const { data: event, error } = await supabase
    .from('events')
    .select('date, start_time, end_time')
    .eq('id', eventId)
    .single();
  
  if (error) {
    console.error('Error fetching event details for notification:', error);
    // Fallback to basic message
    const result = await createNotification(
      assignedUserId,
      'New Event Assignment',
      `You've been assigned to: ${eventName}`,
      'event_assignment',
      eventId,
      { eventName }
    );
    console.log('notifyEventAssignment result:', result);
    return result;
  }
  
  // Format the date and time
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString;
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString;
    }
  };
  
  const eventDate = formatDate(event.date || '');
  const startTime = formatTime(event.start_time || '');
  const endTime = formatTime(event.end_time || '');
  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : '';
  
  const message = eventDate && timeRange 
    ? `${eventName}\n${eventDate} at ${timeRange}`
    : eventName;
  
  const result = await createNotification(
    assignedUserId,
    'You Have Been Assigned to an Event',
    message,
    'event_assignment',
    eventId,
    { eventName, date: event.date, startTime: event.start_time, endTime: event.end_time }
  );
  console.log('notifyEventAssignment result:', result);
  return result;
};

export const notifySetupReminder = async (eventId: number, userId: string, eventName: string) => {
  return createNotification(
    userId,
    'Setup Reminder',
    `Event starts in 10 minutes: ${eventName}`,
    'setup_reminder',
    eventId,
    { eventName }
  );
};

// Test function for creating a test notification
export const createTestNotification = async (userId: string) => {
  return createNotification(
    userId,
    'Test Notification',
    'This is a test notification to verify the system is working!',
    'test',
    undefined,
    { test: true }
  );
}; 