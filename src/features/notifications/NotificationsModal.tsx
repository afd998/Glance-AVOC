import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { isUserEventOwner } from '../../utils/eventUtils';
import { useEventResources } from '../Schedule/hooks/useEvents';

import { useAuth } from '../../contexts/AuthContext';
import { useShiftBlocks } from '../SessionAssignments/hooks/useShiftBlocks';
import NotificationSettings from './NotificationSettings';

type Event = Database['public']['Tables']['events']['Row'];

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScheduledNotification {
  event: Event;
  notificationTime: Date;
  eventStartTime: Date;
  timeUntilNotification: number; // in minutes
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
 
  const { user } = useAuth();
  
  // Get today's date for events and shift blocks
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const { data: allShiftBlocks = [] } = useShiftBlocks(todayString);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if event has staff assistance
  const hasStaffAssistance = (event: Event): boolean => {
    // This is a utility function that might be called multiple times
    // For now, we'll keep the direct parsing here since it's used in a loop
    // In the future, we could optimize this by pre-computing all resources
    if (!event.resources || !Array.isArray(event.resources)) {
      return false;
    }
    return event.resources.some((item: any) => 
      item.itemName === "KSM-KGH-AV-Staff Assistance"
    );
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get time until notification in a readable format
  const getTimeUntilNotification = (minutes: number): string => {
    if (minutes < 0) return 'Overdue';
    if (minutes < 1) return 'Less than 1 minute';
    if (minutes < 60) return `${Math.floor(minutes)} minutes`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  };

  // Fetch scheduled notifications
  const fetchScheduledNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get events for today only
      const notifications: ScheduledNotification[] = [];
      const dateString = today.toISOString().split('T')[0];
        
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('date', dateString)
        .not('start_time', 'is', null)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to fetch events');
        return;
      }

      if (events) {
          events.forEach(event => {
            // Check if event has staff assistance
            if (!hasStaffAssistance(event)) return;

         
            // Check if current user is assigned to this event
            if (!user || !isUserEventOwner(event, user.id, allShiftBlocks)) {
              return;
            }

            // Parse event start time
            let eventStartTime: Date;
            try {
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
            const notificationTime = new Date(eventStartTime.getTime() - (10 * 60 * 1000));
            
            // Only include notifications that haven't been sent yet
            if (notificationTime > now) {
              const timeUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / (1000 * 60));
              
              notifications.push({
                event,
                notificationTime,
                eventStartTime,
                timeUntilNotification
              });
            }
        });
      }

      // Sort by notification time (earliest first)
      notifications.sort((a, b) => a.notificationTime.getTime() - b.notificationTime.getTime());
      
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error fetching scheduled notifications:', error);
      setError('Failed to load scheduled notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh notifications every minute
  useEffect(() => {
    if (isOpen) {
      fetchScheduledNotifications();
      
      const interval = setInterval(() => {
        fetchScheduledNotifications();
      }, 60000); // Refresh every minute

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-9999"
      onClick={onClose}
    >
      <div 
        className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div>
              <h2 className="text-2xl font-semibold">Scheduled Notifications</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Notifications for events with staff assistance (10 minutes before event)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only showing events assigned to you from notification-enabled rooms
              </p>
            </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Notification Settings Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Notification Settings</h3>
          <NotificationSettings />
        </div>
        
        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-3 text-lg">Loading notifications...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {scheduledNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4a2 2 0 00-2 2v9a2 2 0 002 2h5l5-5V9a2 2 0 00-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Scheduled Notifications</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No upcoming events with staff assistance assigned to you for the next 7 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledNotifications.map((notification, index) => (
                    <div 
                      key={`${notification.event.id}-${notification.notificationTime.getTime()}`}
                      className={`border rounded-lg p-4 transition-colors ${
                        notification.timeUntilNotification < 0 
                          ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                          : notification.timeUntilNotification < 30
                          ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {notification.event.event_name}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                              Staff Assistance
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Event Time:</span>
                              <div className="text-gray-900 dark:text-white">
                                {formatTime(notification.eventStartTime)} - {formatTime(new Date(`${notification.event.date}T${notification.event.end_time}`))}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                {formatDate(notification.eventStartTime)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Room:</span>
                              <div className="text-gray-900 dark:text-white">
                                {notification.event.room_name}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">Notification:</span>
                              <div className="text-gray-900 dark:text-white">
                                {formatTime(notification.notificationTime)}
                              </div>
                              <div className={`font-medium ${
                                notification.timeUntilNotification < 0 
                                  ? 'text-red-600 dark:text-red-400'
                                  : notification.timeUntilNotification < 30
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                {getTimeUntilNotification(notification.timeUntilNotification)}
                              </div>
                            </div>
                          </div>
                          
                          {notification.event.instructor_names && Array.isArray(notification.event.instructor_names) && notification.event.instructor_names.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                Instructor{notification.event.instructor_names.length > 1 ? 's' : ''}:
                              </span>
                              <span className="text-gray-900 dark:text-white ml-1">
                                {notification.event.instructor_names.length === 1
                                  ? String(notification.event.instructor_names[0])
                                  : `${notification.event.instructor_names.length} instructors`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {notification.timeUntilNotification < 0 && (
                            <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                              Overdue
                            </span>
                          )}
                          {notification.timeUntilNotification >= 0 && notification.timeUntilNotification < 30 && (
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                              Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {/* Notification explanation text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
            <p>Event notifications appear 15 minutes before events with staff assistance or web conferencing.</p>
            <p className="mt-1">Only events in selected notification rooms will trigger alerts.</p>
          </div>
          
          {/* Action buttons and count */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {scheduledNotifications.length > 0 && (
                <span>
                  {scheduledNotifications.length} notification{scheduledNotifications.length !== 1 ? 's' : ''} scheduled
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchScheduledNotifications}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal; 