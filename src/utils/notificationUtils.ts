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

// Create Panopto check notification
export const createPanoptoCheckNotification = async (
  userId: string,
  eventId: number,
  eventName: string,
  checkNumber: number,
  roomName: string,
  instructorName?: string
): Promise<{ notification: Notification | null; error: any }> => {
  const checkId = `${eventId}-check-${checkNumber}`;
  
  // Validate that eventId is a reasonable number (not a timestamp)
  if (eventId > 999999999) {
    console.error('Invalid eventId (likely a timestamp):', eventId);
    return { notification: null, error: { message: 'Invalid event ID' } };
  }
  
  return createNotification(
    userId,
    `Panopto Check #${checkNumber}`,
    `Time to check Panopto for ${eventName} in ${roomName}`,
    'panopto_check',
    eventId,
    {
      checkId,
      eventId,
      eventName,
      checkNumber,
      roomName,
      instructorName,
      createdAt: new Date().toISOString()
    }
  );
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
    
    // Try to send system notification with basic info
    try {
      await sendSystemNotificationForAssignment(eventName);
    } catch (error) {
      console.error('Failed to send system notification for assignment:', error);
    }
    
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
  
  // Create in-app notification
  const result = await createNotification(
    assignedUserId,
    'You Have Been Assigned to an Event',
    message,
    'event_assignment',
    eventId,
    { eventName, date: event.date, startTime: event.start_time, endTime: event.end_time }
  );
  
  // Send system notification
  try {
    await sendSystemNotificationForAssignment(
      eventName,
      event.date || undefined,
      event.start_time || undefined,
      event.end_time || undefined
    );
  } catch (error) {
    console.error('Failed to send system notification for assignment:', error);
  }
  
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
  const result = await createNotification(
    userId,
    'Test Notification',
    'This is a test notification to verify the system is working!',
    'test',
    undefined,
    { test: true }
  );
  
  // Also send a system notification for testing
  try {
    await sendSystemNotificationForAssignment(
      'Test Event Assignment',
      new Date().toISOString().split('T')[0], // Today's date
      '14:30:00', // 2:30 PM
      '15:30:00'  // 3:30 PM
    );
  } catch (error) {
    console.error('Failed to send test system notification:', error);
  }
  
  return result;
};

// Send browser system notification for event assignment
export const sendSystemNotificationForAssignment = async (
  eventName: string,
  eventDate?: string,
  startTime?: string,
  endTime?: string
): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }

  try {
    // Format the date and time
    const formatTime = (timeString?: string) => {
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
        return timeString || '';
      }
    };
    
    const formatDate = (dateString?: string) => {
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

    const formattedDate = formatDate(eventDate);
    const formattedStartTime = formatTime(startTime);
    const formattedEndTime = formatTime(endTime);
    const timeRange = formattedStartTime && formattedEndTime 
      ? `${formattedStartTime} - ${formattedEndTime}` 
      : '';

    const title = 'You Have Been Assigned to an Event';
    const body = formattedDate && timeRange 
      ? `${eventName}\n${formattedDate} at ${timeRange}`
      : eventName;

    console.log('Sending system notification for event assignment:', { title, body });

    const notification = new Notification(title, {
      body: body,
      icon: '/wildcat2.png',
      badge: '/wildcat2.png',
      tag: `event-assignment-${Date.now()}`,
      requireInteraction: false,
      silent: false,
    });

    // Auto-close after 15 seconds (longer for assignment notifications)
    setTimeout(() => {
      notification.close();
    }, 15000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Error sending event assignment notification:', error);
    return false;
  }
}; 