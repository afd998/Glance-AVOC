import { useState, useEffect, useCallback } from 'react';
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
  const { events } = useEvents(new Date());
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();
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

  // Get events that have recording resources and are assigned to the user
  const getPanoptoEvents = useCallback(() => {
    if (!user || !events) return [];

    return events.filter((event: any) => {
      // Check if event has recording resources
      if (!hasRecordingResource(event)) return false;
      
      // Check if user is assigned to this event
      return isUserEventOwner(event, user.id, allShiftBlocks);
    }).map((event: any) => ({
      eventId: event.id,
      eventName: event.name,
      startTime: event.start_time,
      endTime: event.end_time,
      date: event.date,
      roomName: event.room_name,
      instructorName: event.instructor_name
    }));
  }, [user, events, hasRecordingResource, allShiftBlocks]);

  // Register Panopto events with the service worker
  const registerPanoptoEvents = useCallback(async () => {
    if (!user) return;

    const panoptoEvents = getPanoptoEvents();
    
    if (panoptoEvents.length === 0) return;

    // Send events to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'REGISTER_PANOPTO_CHECKS',
        events: panoptoEvents
      });
    }

    // Create initial "monitoring active" notification for each event
    for (const event of panoptoEvents) {
      await checkExistingPanoptoNotification(event.eventId);
    }
  }, [user, getPanoptoEvents]);

  // Check if a Panopto monitoring notification already exists
  const checkExistingPanoptoNotification = useCallback(async (eventId: number) => {
    if (!user) return;

    try {
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('type', 'panopto_monitoring');

      if (!existingNotifications || existingNotifications.length === 0) {
        // Create monitoring notification
        await createNotification(
          user.id,
          'Panopto Monitoring Active',
          'Monitoring this event for Panopto checks',
          'panopto_monitoring',
          eventId
        );
      }
    } catch (error) {
      console.error('Error checking existing Panopto notification:', error);
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
      registerPanoptoEvents();
    }
  }, [events, user, registerPanoptoEvents]);

  // Load existing checks on mount
  useEffect(() => {
    if (user) {
      loadPanoptoChecks();
    }
  }, [user, loadPanoptoChecks]);

  const activeChecks = panoptoChecks.filter(check => !check.completed);
  const completedChecks = panoptoChecks.filter(check => check.completed);

  return {
    panoptoChecks,
    activeChecks,
    completedChecks,
    isLoading,
    error,
    completePanoptoCheck,
    clearPanoptoChecks,
    registerPanoptoEvents
  };
}; 