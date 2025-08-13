import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { getResourceIcon, getResourceDisplayName, getEventThemeColors } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import OwnerDisplay from './OwnerDisplay';

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
  handOffTime: string | null | undefined;
  isHandOffTimeLoading: boolean;
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
  resources,
  handOffTime,
  isHandOffTimeLoading
}: EventDetailHeaderProps) {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();
  const { data: ownerProfile, isLoading: isOwnerLoading } = useUserProfile(event.man_owner || '');

  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);

  const handleOccurrencesClick = () => {
    navigate(`/${date}/${event.id}/occurrences`);
  };
  return (
    <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 mb-4 lg:mb-0">
          {/* Main Heading - Department Name for Lectures, Full Title for others */}
          {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ? (
            <h1 className="text-xl sm:text-3xl font-bold text-black mb-2">
              {getDepartmentName(event.event_name.substring(0, 4))}
            </h1>
          ) : event.event_name ? (
            <h1 className="text-xl sm:text-3xl font-bold text-black mb-2">
              {event.event_name}
            </h1>
          ) : null}
          
          {/* Lecture Title */}
          {event.lecture_title && (
            <h2 className="text-lg sm:text-2xl font-semibold text-black mb-2">
              {event.lecture_title}
            </h2>
          )}
          
          {/* Session Code */}
          <p className="text-sm sm:text-lg text-black mb-3 sm:mb-4">
            {event.event_name}
          </p>
          
          {/* Date and Time Group with Occurrences Button */}
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="flex flex-col">
              <p className="text-sm sm:text-lg text-black mb-1">{formatDate(event.date || '')}</p>
              <p className="text-sm sm:text-lg text-black">
                {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)} CST
              </p>
            </div>
            <button
              onClick={handleOccurrencesClick}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${themeColors.buttonBg} ${themeColors.buttonText}`}
            >
              Occurrences
            </button>
          </div>
          
          {/* Owner Display - Show for any event */}
          <OwnerDisplay
            event={event}
            isHandOffTimeLoading={isHandOffTimeLoading}
          />
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
        <div className="flex-1 lg:w-1/2 lg:pl-8">
          {/* Event Details Card */}
          <div className={`rounded-lg p-3 mb-3 ${themeColors.cardBg}`}>
            <h3 className="text-sm font-semibold text-black mb-2 uppercase tracking-wide">
              Event Details
            </h3>
            
            {/* Event Type and Room in a grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-black mb-1">Type</span>
                <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                  {event.event_type || 'Unknown'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-black mb-1">Room</span>
                <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                  {event.room_name || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          {resources.length > 0 && (
            <div className={`rounded-lg p-3 ${themeColors.cardBg}`}>
              <h3 className="text-sm font-semibold text-black mb-2 uppercase tracking-wide">
                Resources ({resources.length})
              </h3>
              <div className="space-y-1.5">
                {resources.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${themeColors.itemBg}`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center ${themeColors.iconBg}`}>
                      <span className={`text-xs ${themeColors.iconText}`}>
                        {getResourceIcon(item.itemName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-black truncate">
                          {getResourceDisplayName(item.itemName)}
                        </span>
                        {item.quantity && item.quantity > 1 && (
                          <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                            ×{item.quantity}
                          </span>
                        )}
                      </div>
                      {item.instruction && (
                        <p className="text-xs text-black mt-0.5">
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