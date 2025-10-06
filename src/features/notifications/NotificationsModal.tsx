import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { isUserEventOwner } from '../../utils/eventUtils';

import { useAuth } from '../../contexts/AuthContext';
import { useShiftBlocks } from '../SessionAssignments/hooks/useShiftBlocks';
import NotificationSettings from './NotificationSettings';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Loader2, Bell, AlertTriangle, Clock } from 'lucide-react';

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
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Scheduled Notifications
          </DialogTitle>
          <DialogDescription>
            Notifications for events with staff assistance (10 minutes before event)
            <br />
            <span className="text-xs text-muted-foreground">
              Only showing events assigned to you from notification-enabled rooms
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Notification Settings Section */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium mb-3">Notification Settings</h3>
          <NotificationSettings />
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-lg">Loading notifications...</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-destructive">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {scheduledNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Scheduled Notifications</h3>
                  <p className="text-muted-foreground">
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
                          ? 'border-destructive/20 bg-destructive/5'
                          : notification.timeUntilNotification < 30
                          ? 'border-yellow-500/20 bg-yellow-500/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">
                              {notification.event.event_name}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              Staff Assistance
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Event Time:</span>
                              <div className="font-medium">
                                {formatTime(notification.eventStartTime)} - {formatTime(new Date(`${notification.event.date}T${notification.event.end_time}`))}
                              </div>
                              <div className="text-muted-foreground">
                                {formatDate(notification.eventStartTime)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-muted-foreground">Room:</span>
                              <div className="font-medium">
                                {notification.event.room_name}
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-muted-foreground">Notification:</span>
                              <div className="font-medium">
                                {formatTime(notification.notificationTime)}
                              </div>
                              <div className={`font-medium flex items-center gap-1 ${
                                notification.timeUntilNotification < 0 
                                  ? 'text-destructive'
                                  : notification.timeUntilNotification < 30
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
                                <Clock className="h-3 w-3" />
                                {getTimeUntilNotification(notification.timeUntilNotification)}
                              </div>
                            </div>
                          </div>
                          
                          {notification.event.instructor_names && Array.isArray(notification.event.instructor_names) && notification.event.instructor_names.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium text-muted-foreground">
                                Instructor{notification.event.instructor_names.length > 1 ? 's' : ''}:
                              </span>
                              <span className="ml-1">
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
                            <span className="text-destructive text-sm font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                          {notification.timeUntilNotification >= 0 && notification.timeUntilNotification < 30 && (
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium flex items-center gap-1">
                              <Clock className="h-3 w-3" />
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
        
        <DialogFooter className="flex-col sm:flex-row sm:justify-between">
          <div className="text-sm text-muted-foreground text-center sm:text-left mb-4 sm:mb-0">
            <p>Event notifications appear 15 minutes before events with staff assistance or web conferencing.</p>
            <p className="mt-1">Only events in selected notification rooms will trigger alerts.</p>
            {scheduledNotifications.length > 0 && (
              <p className="mt-2 font-medium">
                {scheduledNotifications.length} notification{scheduledNotifications.length !== 1 ? 's' : ''} scheduled
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchScheduledNotifications}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsModal; 