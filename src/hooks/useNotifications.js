import { useState, useEffect, useRef, useCallback } from 'react';
import { playNotificationAudio } from '../utils/notificationSound';
import useRoomStore from '../stores/roomStore';

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

  const scheduleNotification = useCallback((event, minutesBefore = 15) => {
    if (permission !== 'granted' || !isSupported) {
      return;
    }

    // Check if event has staff assistance or web conferencing
    const matchingReservation = event.itemDetails?.occur?.prof?.[0]?.rsv?.[0];
    if (!matchingReservation) return;

    const hasStaffAssistance = matchingReservation.res?.some(item => 
      item.itemName === "KSM-KGH-AV-Staff Assistance"
    );
    const hasWebConference = matchingReservation.res?.some(item => 
      item.itemName === "KSM-KGH-AV-Web Conference"
    );

    if (!hasStaffAssistance && !hasWebConference) {
      return; // Only notify for events with staff assistance or web conferencing
    }

    // Parse event date and time properly
    let eventDate;
    try {
      // Handle different date formats
      if (typeof event.subject_item_date === 'string') {
        eventDate = new Date(event.subject_item_date);
      } else if (event.subject_item_date instanceof Date) {
        eventDate = new Date(event.subject_item_date);
      } else {
        console.warn('Invalid event date format:', event.subject_item_date);
        return;
      }
    } catch (error) {
      console.warn('Error parsing event date:', error);
      return;
    }

    // Parse start time (handle decimal hours like 8.5 for 8:30 AM)
    let startHour, startMinute;
    try {
      const startTimeFloat = parseFloat(event.start);
      if (isNaN(startTimeFloat)) {
        console.warn('Invalid start time:', event.start);
        return;
      }
      
      startHour = Math.floor(startTimeFloat);
      startMinute = Math.round((startTimeFloat - startHour) * 60);
      
      // Validate time values
      if (startHour < 0 || startHour > 23 || startMinute < 0 || startMinute > 59) {
        console.warn('Invalid time values:', { startHour, startMinute });
        return;
      }
    } catch (error) {
      console.warn('Error parsing start time:', error);
      return;
    }

    // Create the event start time
    const startTime = new Date(eventDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    // Calculate notification time (15 minutes before)
    const notificationTime = new Date(startTime.getTime() - (minutesBefore * 60 * 1000));
    const now = new Date();



    // Only schedule if notification time is in the future
    if (notificationTime > now) {
      const timeoutId = setTimeout(() => {
        
        sendNotification(event, hasStaffAssistance, hasWebConference);
      }, notificationTime.getTime() - now.getTime());

      // Store timeout ID for cleanup
      const eventKey = `${event.id}-${event.subject_item_date}-${event.start}`;
      notificationTimeouts.current.set(eventKey, timeoutId);
      
      
    } else {
      
    }
  }, [permission, isSupported]);

  const sendNotification = useCallback((event, hasStaffAssistance, hasWebConference) => {
    if (permission !== 'granted') return;

    const formatTime = (floatHours) => {
      const hours = Math.floor(floatHours);
      const minutes = Math.round((floatHours - hours) * 60);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };

    const timeDisplay = `${formatTime(event.start)} - ${formatTime(event.end)}`;
    
    let title = `Event Starting Soon: ${event.itemName}`;
    let body = `Your event starts in 15 minutes at ${timeDisplay}`;
    
    if (hasStaffAssistance && hasWebConference) {
      body += ' (Staff Assistance & Web Conference)';
    } else if (hasStaffAssistance) {
      body += ' (Staff Assistance)';
    } else if (hasWebConference) {
      body += ' (Web Conference)';
    }

    const notification = new Notification(title, {
      body: body,
      icon: '/wildcat2.png', // Using wildcat2.png as the app icon
      badge: '/wildcat2.png',
      tag: `event-${event.id}`, // Prevents duplicate notifications
      requireInteraction: false,
      silent: false // This should allow system sounds, but we'll add our own
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
      // You could navigate to the specific event or day view here
    };
  }, [permission]);

  const scheduleNotificationsForEvents = useCallback((events) => {
    // Clear existing timeouts
    notificationTimeouts.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    notificationTimeouts.current.clear();

    const { notificationRooms } = useRoomStore.getState();
    

    // Schedule new notifications
    events.forEach(event => {
      // Skip events that don't have required data
      if (!event.subject_item_date || !event.start || !event.itemName) {
        
        return;
      }

      // Skip events that are not in notification-enabled rooms
      if (!notificationRooms.includes(event.room)) {
        
        return;
      }

      // Check if event is today and not already passed
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let eventDate;
      try {
        eventDate = new Date(event.subject_item_date);
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        // If event is not today, skip it
        if (eventDay.getTime() !== today.getTime()) {
          
          return;
        }
      } catch (error) {
        
        return;
      }

      // Check if event has already started
      const startTimeFloat = parseFloat(event.start);
      if (!isNaN(startTimeFloat)) {
        const currentHour = now.getHours() + (now.getMinutes() / 60);
        if (startTimeFloat <= currentHour) {
          return;
        }
      }

      scheduleNotification(event, 15);
    });
  }, [scheduleNotification]);

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
    scheduleNotification,
    sendNotification,
    scheduleNotificationsForEvents,
    clearAllNotifications
  };
} 
