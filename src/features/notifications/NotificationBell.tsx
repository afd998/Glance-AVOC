import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInAppNotifications } from './useInAppNotifications';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { createTestNotification } from '../../utils/notificationUtils';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Plus, Clock, FileText, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useInAppNotifications();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }
    
    // Navigate to event page if notification has an event_id
    if (notification.event_id && notification.type === 'event_assignment') {
      try {
        // Fetch the event data to get the date
        const { data: event, error } = await supabase
          .from('events')
          .select('date')
          .eq('id', notification.event_id)
          .single();
        
        if (error) {
          console.error('Error fetching event data:', error);
          return;
        }
        
        if (event?.date) {
          // Navigate to the event page: /date/eventId
          navigate(`/${event.date}/${notification.event_id}`);
        }
      } catch (error) {
        console.error('Error navigating to event:', error);
      }
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleClearAllNotifications = async () => {
    // Delete all notifications for the current user
    for (const notification of notifications) {
      await deleteNotification(notification.id);
    }
  };

  const handleTestNotification = async () => {
    if (user?.id) {
      await createTestNotification(user.id);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_assignment':
        return <FileText className="w-4 h-4" />;
      case 'setup_reminder':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="default"
       
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {Math.min(unreadCount, 99) > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl border z-9999 backdrop-blur-md ${
          isDarkMode 
            ? 'bg-gray-800/40 border-gray-600/30 text-white' 
            : 'bg-white/40 border-gray-200/30 text-gray-900'
        }`}>
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Notifications</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleTestNotification}
                  className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                    isDarkMode 
                      ? 'text-green-400 hover:text-green-300' 
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  Test
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                      isDarkMode 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-red-600 hover:text-red-700'
                    }`}
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    Mark all as read
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Regular Notifications Section */}
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No notifications
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group backdrop-blur-sm ${
                      notification.read_at
                        ? isDarkMode 
                          ? 'bg-gray-700/80 hover:bg-gray-600/90' 
                          : 'bg-gray-50/80 hover:bg-gray-100/90'
                        : isDarkMode 
                          ? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-500/30' 
                          : 'bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${
                        notification.read_at 
                          ? isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${
                              notification.read_at 
                                ? isDarkMode ? 'text-gray-300' : 'text-gray-900'
                                : isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-2 ${
                              isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                          
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className={`ml-2 p-1 rounded transition-colors ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                            title="Delete notification"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};