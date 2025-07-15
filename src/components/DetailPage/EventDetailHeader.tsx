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
  hasVideoRecording: boolean;
  resources: ResourceItem[];
}

// Helper function to format ISO timestamp to time string
const formatTimeFromISO = (isoString: string | null): string => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

export default function EventDetailHeader({ 
  event, 
  facultyMember, 
  isFacultyLoading,
  hasVideoRecording,
  resources
}: EventDetailHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 w-1/2">
          {/* Main Heading - Department Name for Lectures, Full Title for others */}
          {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ? (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getDepartmentName(event.event_name.substring(0, 4))}
            </h1>
          ) : event.event_name ? (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {event.event_name}
            </h1>
          ) : null}
          
          {/* Lecture Title */}
          {event.lecture_title && (
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {event.lecture_title}
            </h2>
          )}
          
          {/* Session Code */}
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
            {event.event_name}
          </p>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-1">{formatDate(event.start_time || '')}</p>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
            {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)}
          </p>
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
        <div className="flex-1 w-1/2 pl-8">
          {/* Event Type and Room */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type:</span>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                {event.event_type || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Room:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{event.room_name || 'Unknown'}</span>
            </div>
          </div>

          {/* Resources */}
          {resources.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Resources:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resources.map((item, index) => (
                  <div 
                    key={index} 
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="flex-shrink-0 text-base">
                      {getResourceIcon(item.itemName)}
                    </span>
                    <span className="whitespace-nowrap">{getResourceDisplayName(item.itemName)}</span>
                    {item.quantity && item.quantity > 1 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full">
                        {item.quantity}
                      </span>
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