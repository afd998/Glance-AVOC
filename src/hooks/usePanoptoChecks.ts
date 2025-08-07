import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from './useEvents';
import { useAllShiftBlocks } from './useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { parseEventResources } from '../utils/eventUtils';
import { createNotification, deleteNotification } from '../utils/notificationUtils';
import { supabase } from '../lib/supabase';

interface PanoptoCheck {
  id: string;
  eventId: number;
  eventName: string;
  checkNumber: number;
  createdAt: string | null;
  completed: boolean;
  roomName: string;
  instructorName?: string;
}

interface PanoptoEvent {
  eventId: number;
  eventName: string;
  startTime: string;
  endTime: string;
  date: string;
  roomName: string;
  instructorName?: string;
}

export const usePanoptoChecks = () => {
  const { user } = useAuth();
  
  // Use local date instead of UTC to avoid timezone issues
  // Memoize the date to prevent infinite re-renders, but update it periodically
  const [localDate, setLocalDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  // Update the date every minute to ensure we're checking the right day
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      const newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setLocalDate(newDate);
    };

    // Update immediately
    updateDate();

    // Then update every minute
    const interval = setInterval(updateDate, 60000);

    return () => clearInterval(interval);
  }, []);
  
  console.log('📅 Requesting events for date:', localDate.toISOString().split('T')[0], 'at', new Date().toLocaleTimeString());
  const { events } = useEvents(localDate);
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();
  
  // Memoize allShiftBlocks to prevent unnecessary re-renders
  const memoizedAllShiftBlocks = useMemo(() => allShiftBlocks, [allShiftBlocks]);
  const [panoptoChecks, setPanoptoChecks] = useState<PanoptoCheck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if an event has recording resources
  const hasRecordingResource = useCallback((event: any) => {
    if (!event.resources) return false;
    
    const resourceFlags = parseEventResources(event);
    return resourceFlags.resources.some((resource: any) => 
      resource.itemName?.toLowerCase().includes('panopto') ||
      resource.itemName?.toLowerCase().includes('recording')
    );
  }, []);

  // Check if an event is currently happening
  const isEventCurrentlyActive = useCallback((event: any) => {
    const now = new Date();
    // Use local date instead of UTC to avoid timezone issues
    const localDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const today = localDate.toISOString().split('T')[0];
    
    // Check if event is today
    if (event.date !== today) return false;
    
    // Check if current time is between start and end time
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    return currentTime >= event.start_time && currentTime <= event.end_time;
  }, []);

  // Get events that have recording resources and are assigned to the user
  const getPanoptoEvents = useCallback(() => {
    if (!user || !events) return [];

    console.log('🔍 Checking events for Panopto monitoring...');
    console.log('📅 Current time:', new Date().toTimeString().split(' ')[0]);
    console.log('📅 Today:', new Date().toISOString().split('T')[0]);
    console.log('📅 Events loaded for date:', events.length > 0 ? events[0]?.date : 'No events');
    console.log('📅 Total events loaded:', events.length);

    const filteredEvents = events.filter((event: any) => {
      console.log(`\n📋 Event: ${event.event_name} (${event.date} ${event.start_time}-${event.end_time})`);
      
      // Check if event has recording resources
      const hasRecording = hasRecordingResource(event);
      console.log(`  📹 Has recording: ${hasRecording}`);
      if (!hasRecording) return false;
      
      // Check if user is assigned to this event
      const isAssigned = isUserEventOwner(event, user.id, memoizedAllShiftBlocks);
      console.log(`  👤 Is assigned: ${isAssigned}`);
      if (!isAssigned) return false;
      
      // Check if event is currently happening
      const isActive = isEventCurrentlyActive(event);
      console.log(`  ⏰ Is currently active: ${isActive}`);
      if (!isActive) return false;
      
      console.log(`  ✅ Event will be monitored!`);
      return true;
    });

    console.log(`\n🎯 Found ${filteredEvents.length} events to monitor`);

    return filteredEvents.map((event: any) => ({
      eventId: event.id,
      eventName: event.event_name,
      startTime: event.start_time,
      endTime: event.end_time,
      date: event.date,
      roomName: event.room_name,
      instructorName: event.instructor_name
    }));
  }, [user?.id, events, memoizedAllShiftBlocks]); // Simplified dependencies

  // Register Panopto events with the service worker
  const registerPanoptoEvents = useCallback(async () => {
    if (!user) return;

    const panoptoEvents = getPanoptoEvents();
    
    console.log('🔄 Registering Panopto events:', panoptoEvents.length, 'events found');
    
    // Clear old monitoring notifications for events that are no longer active
    await clearOldMonitoringNotifications(panoptoEvents);
    
    if (panoptoEvents.length === 0) {
      console.log('📭 No active Panopto events to monitor');
      return;
    }

    // Send events to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'REGISTER_PANOPTO_CHECKS',
        events: panoptoEvents
      });
    }

    // Clear any existing monitoring notifications for active events to prevent duplicates
    console.log('🧹 Clearing existing monitoring notifications for active events to prevent duplicates...');
    for (const event of panoptoEvents) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', event.eventId)
          .eq('type', 'panopto_monitoring');
        
        if (error) {
          console.error(`Error clearing existing monitoring notification for event ${event.eventId}:`, error);
        } else {
          console.log(`🧹 Cleared existing monitoring notification for event ${event.eventId}`);
        }
      } catch (error) {
        console.error(`Error clearing existing monitoring notification for event ${event.eventId}:`, error);
      }
    }

    // Create initial "monitoring active" notification for each event
    console.log('📝 Creating new monitoring notifications for active events...');
    for (const event of panoptoEvents) {
      await checkExistingPanoptoNotification(event.eventId, event);
    }
  }, [user?.id, getPanoptoEvents]); // Simplified dependencies

  // Clear monitoring notifications for events that are no longer active
  const clearOldMonitoringNotifications = useCallback(async (activeEvents: PanoptoEvent[]) => {
    if (!user) return;

    try {
      console.log('🧹 Clearing old monitoring notifications...');
      
      // Get all monitoring notifications for this user
      const { data: monitoringNotifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'panopto_monitoring');

      if (error) {
        console.error('Error fetching monitoring notifications:', error);
        return;
      }

      if (!monitoringNotifications) {
        console.log('📭 No existing monitoring notifications found');
        return;
      }

      console.log(`📋 Found ${monitoringNotifications.length} existing monitoring notifications`);

      // Find notifications for events that are no longer active
      const activeEventIds = activeEvents.map(event => event.eventId);
      const notificationsToDelete = monitoringNotifications.filter(notification => 
        notification.event_id && !activeEventIds.includes(notification.event_id)
      );

      console.log(`🗑️ Found ${notificationsToDelete.length} notifications to delete`);

      // Delete old monitoring notifications
      for (const notification of notificationsToDelete) {
        await deleteNotification(notification.id);
        console.log(`🗑️ Deleted monitoring notification for event ${notification.event_id}`);
      }

      if (notificationsToDelete.length > 0) {
        console.log(`✅ Cleared ${notificationsToDelete.length} old monitoring notifications`);
      } else {
        console.log('✅ No old monitoring notifications to clear');
      }
    } catch (error) {
      console.error('Error clearing old monitoring notifications:', error);
    }
  }, [user]);

  // Create a Panopto monitoring notification for an event
  const checkExistingPanoptoNotification = useCallback(async (eventId: number, event: PanoptoEvent) => {
    if (!user) return;

    try {
      console.log(`📝 Creating monitoring notification for event ${eventId}: ${event.eventName}`);
      
      // Since we've already cleared existing notifications, we can just create a new one
      await createNotification(
        user.id,
        'Panopto Monitoring Active',
        `Monitoring "${event.eventName}" in ${event.roomName} for Panopto checks`,
        'panopto_monitoring',
        eventId,
        {
          eventId: event.eventId,
          eventName: event.eventName,
          roomName: event.roomName,
          startTime: event.startTime,
          endTime: event.endTime,
          date: event.date
        }
      );
      console.log(`✅ Successfully created monitoring notification for event ${eventId}`);
    } catch (error) {
      console.error(`Error creating monitoring notification for event ${eventId}:`, error);
    }
  }, [user]);

  // Complete a Panopto check
  const completePanoptoCheck = useCallback(async (checkId: string) => {
    // Send completion message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'COMPLETE_PANOPTO_CHECK',
        checkId
      });
    }

    // Create completion notification in Supabase
    if (user) {
      const check = panoptoChecks.find(c => c.id === checkId);
      if (check) {
        await createNotification(
          user.id,
          'Panopto Check Completed',
          `Completed check for ${check.eventName}`,
          'panopto_check_completed',
          check.eventId
        );
      }
    }

    // Update local state
    setPanoptoChecks(prev => 
      prev.map(check => 
        check.id === checkId 
          ? { ...check, completed: true }
          : check
      )
    );
  }, [user, panoptoChecks]);

  // Clear all Panopto checks
  const clearPanoptoChecks = useCallback(async () => {
    // Clear from service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_PANOPTO_CHECKS'
      });
    }

    // Clear from Supabase
    if (user) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', user.id)
          .in('type', ['panopto_check', 'panopto_monitoring', 'panopto_check_completed']);
      } catch (error) {
        console.error('Error clearing Panopto notifications:', error);
      }
    }

    setPanoptoChecks([]);
  }, [user]);

  // Load Panopto checks from Supabase
  const loadPanoptoChecks = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'panopto_check')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading Panopto checks:', error);
        return;
      }

      if (notifications) {
        const checks: PanoptoCheck[] = notifications
          .filter(notification => notification.data && typeof notification.data === 'object')
          .map(notification => {
            const data = notification.data as any;
            return {
              id: data.checkId || notification.id.toString(),
              eventId: data.eventId || 0,
              eventName: data.eventName || 'Unknown Event',
              checkNumber: data.checkNumber || 1,
              createdAt: notification.created_at,
              completed: false,
              roomName: data.roomName || 'Unknown Room',
              instructorName: data.instructorName
            };
          });

        setPanoptoChecks(checks);
      }
    } catch (error) {
      console.error('Error loading Panopto checks:', error);
      setError('Failed to load Panopto checks');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initialize and listen for service worker messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'PANOPTO_CHECKS_UPDATED') {
        setPanoptoChecks(event.data.checks);
      } else if (event.data.type === 'PANOPTO_CHECK_CREATED') {
        // Add new check to the list
        setPanoptoChecks(prev => {
          const existing = prev.find(check => check.id === event.data.check.id);
          if (existing) return prev;
          return [...prev, event.data.check];
        });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Register events when they change
  useEffect(() => {
    if (events && user) {
      // Add more aggressive debounce to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        console.log('⏰ Debounced registerPanoptoEvents call triggered');
        registerPanoptoEvents();
      }, 2000); // Increased to 2 seconds
      
      return () => {
        console.log('⏰ Clearing previous debounce timeout');
        clearTimeout(timeoutId);
      };
    }
  }, [events, user?.id, registerPanoptoEvents]);

  // Load existing checks on mount
  useEffect(() => {
    if (user) {
      loadPanoptoChecks();
    }
  }, [user, loadPanoptoChecks]);

  const activeChecks = panoptoChecks.filter(check => !check.completed);
  const completedChecks = panoptoChecks.filter(check => check.completed);

  // Clear all Panopto monitoring notifications (for debugging/reset)
  const clearAllPanoptoMonitoringNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🧹 Clearing ALL Panopto monitoring notifications...');
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('type', 'panopto_monitoring');

      if (error) {
        console.error('Error clearing all Panopto monitoring notifications:', error);
      } else {
        console.log('✅ Cleared all Panopto monitoring notifications');
      }
    } catch (error) {
      console.error('Error clearing all Panopto monitoring notifications:', error);
    }
  }, [user]);

  return {
    panoptoChecks,
    activeChecks,
    completedChecks,
    isLoading,
    error,
    completePanoptoCheck,
    clearPanoptoChecks,
    clearAllPanoptoMonitoringNotifications,
    registerPanoptoEvents
  };
}; 