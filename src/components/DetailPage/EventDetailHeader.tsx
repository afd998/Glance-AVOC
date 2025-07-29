import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { getResourceIcon, getResourceDisplayName } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';

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
const formatTimeFromISO = (timeString: string | null): string => {
  if (!timeString) return '';
  try {
    // Parse HH:MM:SS format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } catch (error) {
    console.error('Error formatting time:', timeString, error);
    return '';
  }
};

export default function EventDetailHeader({ 
  event, 
  facultyMember, 
  isFacultyLoading,
  resources
}: EventDetailHeaderProps) {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { data: ownerProfile, isLoading: isOwnerLoading } = useUserProfile(event.owner || '');

  const handleOccurrencesClick = () => {
    navigate(`/${date}/${event.id}/occurrences`);
  };
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
            {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)} CST
          </p>
          

          
          {/* Occurrences Button */}
          <div className="mb-3 sm:mb-4">
            <button
              onClick={handleOccurrencesClick}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              Occurrences
            </button>
          </div>
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
        <div className="flex-1 lg:w-1/2 lg:pl-8">
          {/* Event Details Card */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
              Event Details
            </h3>
            
            {/* Event Type and Room in a grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</span>
                <span className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg inline-flex items-center justify-center">
                  {event.event_type || 'Unknown'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Room</span>
                <span className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-lg inline-flex items-center justify-center">
                  {event.room_name || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Owner Assignment */}
            {event.owner && (
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Assigned to</span>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <Avatar userId={event.owner} size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {isOwnerLoading ? 'Loading...' : (ownerProfile?.name || 'Unknown User')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Event Owner
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resources Card */}
          {resources.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Resources ({resources.length})
              </h3>
              <div className="space-y-2">
                {resources.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm">
                        {getResourceIcon(item.itemName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getResourceDisplayName(item.itemName)}
                        </span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full">
                            ×{item.quantity}
                          </span>
                        )}
                      </div>
                      {item.instruction && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.instruction}
                        </p>
                      )}
                    </div>
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