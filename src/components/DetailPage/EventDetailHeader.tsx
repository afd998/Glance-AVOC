import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { getResourceIcon, getResourceDisplayName, getEventThemeColors } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';
import Avatar from '../Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import OwnerDisplay from './OwnerDisplay';
import { FacultyAvatar } from '../FacultyAvatar';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface ResourceItem {
  itemName: string;
  quantity?: number;
  [key: string]: any;
}

interface EventDetailHeaderProps {
  event: Event;
  facultyMembers: FacultyMember[];
  instructorNames: string[];
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
  facultyMembers,
  instructorNames,
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
  
  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);

  const handleOccurrencesClick = () => {
    navigate(`/${date}/${event.id}/occurrences`);
  };
  return (
    <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 mb-4 lg:mb-0">
          {/* Background container for the first 3 elements with faculty photo */}
          <div className={`${themeColors.cardBg} rounded-lg p-4 mb-4`}>
            <div className="flex items-center gap-4">
              {/* Left side - Faculty photos */}
              {instructorNames.length > 0 && (
                <div className="flex-shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      onMouseEnter={() => setIsFacultyHovering(true)}
                      onMouseLeave={() => setIsFacultyHovering(false)}
                      className="bg-purple-900/30 p-2 rounded-lg flex items-center justify-center z-20 relative"
                    >
                      {instructorNames.length === 1 ? (
                        (() => {
                          const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorNames[0]);
                          return facultyMember?.kelloggdirectory_image_url ? (
                            <FacultyAvatar
                              imageUrl={facultyMember.kelloggdirectory_image_url}
                              cutoutImageUrl={facultyMember.cutout_image}
                              instructorName={instructorNames[0]}
                              isHovering={isFacultyHovering}
                              size="lg"
                              className="h-20 w-20"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                              {instructorNames[0].charAt(0).toUpperCase()}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex -space-x-2">
                          {instructorNames.slice(0, 3).map((instructorName, index) => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorName);
                            return facultyMember?.kelloggdirectory_image_url ? (
                              <img
                                key={`${instructorName}-${index}`}
                                src={facultyMember.kelloggdirectory_image_url}
                                alt={instructorName}
                                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div
                                key={`${instructorName}-${index}`}
                                className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-white font-medium"
                                title={instructorName}
                              >
                                {instructorName.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                          {instructorNames.length > 3 && (
                            <div className="h-12 w-12 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white font-medium text-sm">
                              +{instructorNames.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] leading-tight font-medium opacity-90 text-center whitespace-normal w-20 line-clamp-2 transition-all duration-200">
                      {instructorNames.length === 1 ? instructorNames[0] : `${instructorNames.length} instructors`}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Right side - Event info */}
              <div className="flex-1">
                {/* Course Code - Beginning part in bold */}
                {event.event_name && (
                  <h1 className="text-xl sm:text-3xl font-bold text-black mb-2">
                    {(() => {
                      const eventNameCopy = event.event_name ? String(event.event_name) : '';
                      const dashIndex = eventNameCopy.indexOf('-');
                      return dashIndex !== -1 ? eventNameCopy.substring(0, dashIndex) : eventNameCopy;
                    })()}
                  </h1>
                )}
                
                {/* Lecture Title */}
                {event.lecture_title && (
                  <h2 className="text-lg sm:text-2xl font-semibold text-black mb-2">
                    {event.lecture_title}
                  </h2>
                )}
                
                {/* Session Code */}
                <p className="text-sm sm:text-lg text-black mb-0">
                  {event.event_name}
                </p>
              </div>
            </div>
          </div>
          
          {/* Room and Occurrences Row */}
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            {/* Room Section */}
            <div className={`${themeColors.cardBg} rounded-lg p-3`}>
              <span className="text-xs font-medium text-black mb-1 block">Room</span>
              <span className="text-lg font-bold text-black">
                {event.room_name || 'Unknown'}
              </span>
            </div>
            
            {/* Occurrences Section with Date, Time, and Button */}
            <div className={`${themeColors.cardBg} rounded-lg p-3 z-20 relative`}>
              <span className="text-xs font-medium text-black mb-1 block">Occurrences</span>
              <div className={`flex items-center gap-3 transition-all duration-200 hover:${themeColors.itemBg} cursor-pointer rounded-lg p-2`} onClick={handleOccurrencesClick}>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg">
                  <svg className="w-5 h-5 text-black mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm sm:text-lg text-black mb-0">{formatDate(event.date || '')}</p>
                  <p className="text-sm sm:text-lg text-black">
                    {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)} CST
                  </p>
                </div>
              </div>
            </div>
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
            
            {/* Department Name/Event Name */}
            <div className="mb-3">
              <span className="text-xs font-medium text-black mb-1 block">Event</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ? 
                  getDepartmentName(event.event_name.substring(0, 4)) : 
                  (event.event_name || 'Unknown')}
              </span>
            </div>
            
            {/* Event Type */}
            <div className="mb-2">
              <span className="text-xs font-medium text-black mb-1 block">Type</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                {event.event_type || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Resources Card */}
          {resources.length > 0 && (
            <div className={`rounded-lg p-4 ${themeColors.cardBg} shadow-lg`}>
              <h3 className="text-lg font-bold mb-4 text-black">
                Resources ({resources.length})
              </h3>
              <div className="space-y-3">
                {resources.map((item, index) => (
                  <div 
                    key={index} 
                    className={`rounded-lg p-3 shadow-md hover:shadow-lg transition-all duration-200 ${themeColors.itemBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${themeColors.iconBg}`}>
                        <span className={`text-sm font-bold ${themeColors.iconText}`}>
                          {getResourceIcon(item.itemName)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-black">
                            {getResourceDisplayName(item.itemName)}
                          </span>
                          {item.quantity && item.quantity > 1 && (
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${themeColors.badgeBg} ${themeColors.badgeText}`}>
                              ×{item.quantity}
                            </span>
                          )}
                        </div>
                        {item.instruction && (
                          <p className="text-xs leading-relaxed text-black">
                            {item.instruction}
                          </p>
                        )}
                      </div>
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