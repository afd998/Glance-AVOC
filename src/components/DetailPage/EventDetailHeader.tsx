import React from 'react';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { parseRoomName } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface EventDetailHeaderProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  hasVideoRecording: boolean;
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
  hasVideoRecording
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

          {/* Instructor Info */}
          {event.instructor_name && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-3">
                {facultyMember?.kelloggdirectory_image_url ? (
                  <img 
                    src={facultyMember.kelloggdirectory_image_url} 
                    alt={event.instructor_name}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Error loading faculty image:', facultyMember.kelloggdirectory_image_url);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <span className="text-gray-600 dark:text-gray-400">👤</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">{event.instructor_name}</h3>
                  {facultyMember?.kelloggdirectory_title && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{facultyMember.kelloggdirectory_title}</p>
                  )}
                  {isFacultyLoading && (
                    <p className="text-xs text-gray-400">Loading faculty info...</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
} 