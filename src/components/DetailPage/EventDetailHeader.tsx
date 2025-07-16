import React from 'react';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { parseRoomName } from '../../utils/eventUtils';
import { getResourceIcon, getResourceDisplayName } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface ResourceItem {
  itemName: string;
  quantity?: number;
  [key: string]: any;
}

interface EventDetailHeaderProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  resources: ResourceItem[];
}

// Helper function to format ISO timestamp to time string
const formatTimeFromISO = (isoString: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // Adjust for timezone offset since timestamps are stored as Chicago time
    // but JavaScript interprets them as UTC
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
    const adjustedDate = new Date(date.getTime() + timezoneOffset);
    return adjustedDate.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  } catch (error) {
    console.error('Error formatting time:', isoString, error);
    return '';
  }
};

export default function EventDetailHeader({ 
  event, 
  facultyMember, 
  isFacultyLoading,
  resources
}: EventDetailHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 mb-4 lg:mb-0">
          {/* Main Heading - Department Name for Lectures, Full Title for others */}
          {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ? (
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getDepartmentName(event.event_name.substring(0, 4))}
            </h1>
          ) : event.event_name ? (
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {event.event_name}
            </h1>
          ) : null}
          
          {/* Lecture Title */}
          {event.lecture_title && (
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {event.lecture_title}
            </h2>
          )}
          
          {/* Session Code */}
          <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
            {event.event_name}
          </p>
          
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mb-1">{formatDate(event.start_time || '')}</p>
          <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
            {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)}
          </p>
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
        <div className="flex-1 lg:w-1/2 lg:pl-8">
          {/* Event Type and Room */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                {event.event_type || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Room:</span>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">{event.room_name || 'Unknown'}</span>
            </div>
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Resources:</span>
              </div>
              <div className="flex flex-col gap-2">
                {resources.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col gap-1 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs sm:text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 text-sm sm:text-base">
                        {getResourceIcon(item.itemName)}
                      </span>
                      <span className="font-medium">{getResourceDisplayName(item.itemName)}</span>
                      {item.quantity && item.quantity > 1 && (
                        <span className="ml-1 px-1 sm:px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    {item.instruction && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-6">
                        {item.instruction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
} 