import { useState, useEffect, useRef, useCallback } from 'react';
import { playNotificationAudio } from '../../utils/notificationSound';
import { notifySetupReminder } from '../../utils/notificationUtils';

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const notificationTimeouts = useRef(new Map());

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (event) => {
    if (permission !== 'granted') return;

    const formatTime = (isoString) => {
      if (!isoString) return '';
      try {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      } catch (error) {
        console.error('Error formatting time:', isoString, error);
        return '';
      }
    };

    const timeDisplay = `${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
    const title = `Event Starting Soon: ${event.event_name}`;
    const body = `Your event starts in 10 minutes at ${timeDisplay} (Staff Assistance)`;

    const notification = new Notification(title, {
      body: body,
      icon: '/wildcat2.png',
      badge: '/wildcat2.png',
      tag: `event-${event.id}`,
      requireInteraction: false,
      silent: false
    });

    // Play notification sound
    playNotificationAudio();

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Also send in-app notification
    try {
      await notifySetupReminder(
        event.id,
        event.man_owner || '',
        event.event_name
      );
    } catch (error) {
      console.error('Failed to send in-app setup reminder notification:', error);
    }
  }, [permission]);

  const hasStaffAssistance = useCallback((event) => {
    if (!event.resources) return false;

    let resourcesArray = [];
    try {
      if (typeof event.resources === 'string') {
        resourcesArray = JSON.parse(event.resources);
      } else if (Array.isArray(event.resources)) {
        resourcesArray = event.resources;
      } else if (event.resources && typeof event.resources === 'object') {
        resourcesArray = event.resources.resources || event.resources.res || [];
      }
    } catch (error) {
      console.log('Error parsing resources for event:', event.event_name, error);
      return false;
    }

    return Array.isArray(resourcesArray) && resourcesArray.some(item => 
      item.itemName === "KSM-KGH-AV-Staff Assistance"
    );
  }, []);

  const scheduleNotificationForEvent = useCallback((event) => {
    // Clear any existing notification for this event
    const eventKey = `event-${event.id}`;
    if (notificationTimeouts.current.has(eventKey)) {
      clearTimeout(notificationTimeouts.current.get(eventKey));
      notificationTimeouts.current.delete(eventKey);
    }

    // Check if event has staff assistance
    if (!hasStaffAssistance(event)) {
      console.log('Event does not have staff assistance:', event.event_name);
      return;
    }

    // Parse event start time (now in HH:MM:SS format, need to combine with date)
    let eventStartTime;
    try {
      // Combine date and time to create a full timestamp
      const eventDateTime = `${event.date}T${event.start_time}`;
      eventStartTime = new Date(eventDateTime);
      if (isNaN(eventStartTime.getTime())) {
        console.warn('Invalid start_time format:', event.start_time);
        return;
      }
    } catch (error) {
      console.warn('Error parsing event start_time:', error);
      return;
    }

    // Calculate notification time (10 minutes before event)
    const notificationTime = new Date(eventStartTime.getTime() - (10 * 60 * 1000)); // 10 minutes before
    const now = new Date();

    console.log('Scheduling notification for:', event.event_name, {
      eventStart: eventStartTime.toLocaleString(),
      notificationTime: notificationTime.toLocaleString(),
      now: now.toLocaleString()
    });

    // If notification time has already passed, don't schedule
    if (notificationTime <= now) {
      console.log('Notification time has passed for:', event.event_name);
      return;
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      sendNotification(event);
      notificationTimeouts.current.delete(eventKey);
      console.log('Sent notification for:', event.event_name);
    }, notificationTime.getTime() - now.getTime());

    notificationTimeouts.current.set(eventKey, timeoutId);
    console.log('Scheduled notification for:', event.event_name, 'at', notificationTime.toLocaleString());
  }, [hasStaffAssistance, sendNotification]);

  const scheduleNotificationsForEvents = useCallback((events) => {
    // Clear all existing notifications
    notificationTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    notificationTimeouts.current.clear();

    const { notificationRooms } = useRoomStore.getState();
    
    console.log('Scheduling notifications for events:', {
      totalEvents: events.length,
      notificationRooms,
      permission,
      isSupported
    });

    // Filter and schedule notifications for relevant events
    events.forEach(event => {
      // Skip events without required data
      if (!event.start_time || !event.event_name) {
     
        return;
      }

      // Skip events not in notification-enabled rooms
      if (!notificationRooms.includes(event.room_name)) {
       
        return;
      }

      // Check if event is today
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let eventDate;
      try {
        eventDate = new Date(event.start_time);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        if (eventDay.getTime() !== today.getTime()) {
          return;
        }
      } catch (error) {
        console.log('Skipping event - date parsing error:', error);
        return;
      }

      // Check if event has already started
      const eventStartTime = new Date(event.start_time);
      if (eventStartTime <= now) {
        console.log('Skipping event - already started:', event.event_name);
        return;
      }

      // Schedule notification for this event
      scheduleNotificationForEvent(event);
    });
  }, [scheduleNotificationForEvent]);

  const clearAllNotifications = useCallback(() => {
    notificationTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    notificationTimeouts.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllNotifications();
    };
  }, [clearAllNotifications]);

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    scheduleNotificationsForEvents,
    clearAllNotifications
  };
} 
