import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { getResourceIcon, getResourceDisplayName, getEventThemeColors, getAVResourceIcon, shouldUseZoomIcon } from '../../utils/eventUtils';
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
    <div className={`${themeColors[5]} rounded-lg shadow-lg p-3 sm:p-6 mb-4 sm:mb-6 ${themeColors.border3}`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 mb-4 lg:mb-0">
          {/* Background container for the first 3 elements with faculty photo */}
          <div className={`${themeColors[3]} rounded-lg p-4 mb-4 ${themeColors.border2}`}>
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
            <div className={`${themeColors[3]} rounded-lg p-3 ${themeColors.border2}`}>
              <span className={`text-xs font-medium text-black mb-1 block`}>Room</span>
              <span className={`text-lg font-bold text-black`}>
                {event.room_name || 'Unknown'}
              </span>
            </div>

            {/* Occurrences Section with Date, Time, and Button */}
            <div className={`${themeColors[3]} rounded-lg p-3 z-20 relative ${themeColors.border2}`}>
              <span className={`text-xs font-medium text-black mb-1 block`}>Occurrences</span>
              <div className={`flex items-center gap-3 transition-all duration-200 hover:${themeColors[4]} cursor-pointer rounded-lg p-2`} onClick={handleOccurrencesClick}>
                <div className="flex flex-col items-center justify-center p-2 rounded-lg">
                  <svg className={`w-5 h-5 text-black mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg className={`w-5 h-5 text-black`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm sm:text-lg text-black mb-0`}>{formatDate(event.date || '')}</p>
                  <p className={`text-sm sm:text-lg text-black`}>
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
          <div className={`rounded-lg p-3 mb-3 ${themeColors[3]} ${themeColors.border2}`}>
            <h3 className={`text-sm font-semibold text-black mb-2 uppercase tracking-wide`}>
              Event Details
            </h3>

            {/* Department Name/Event Name */}
            <div className="mb-3">
              <span className={`text-xs font-medium text-black mb-1 block`}>Event</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors[7]} text-black`}>
                {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ?
                  getDepartmentName(event.event_name.substring(0, 4)) :
                  (event.event_name || 'Unknown')}
              </span>
            </div>

            {/* Event Type */}
            <div className="mb-2">
              <span className={`text-xs font-medium text-black mb-1 block`}>Type</span>
              <span className={`px-2 py-1 text-sm font-medium rounded-lg inline-flex items-center justify-center ${themeColors[7]} text-black`}>
                {event.event_type || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Resources Card */}
          {resources.length > 0 && (
            <div className={`rounded-xl shadow-lg ${themeColors.border3} overflow-hidden ${themeColors[1]}`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${themeColors[2]} ${themeColors[3]} px-6 py-4 ${themeColors.border2}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-black tracking-tight">
                    Resources
                  </h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${themeColors[6]} text-white`}>
                    {resources.length} total
                  </span>
                </div>
              </div>

              {/* Split resources into two groups */}
              {(() => {
                const ksmResources = resources.filter(item =>
                  item.itemName?.toLowerCase().startsWith('ksm-kgh-video') ||
                  item.itemName?.toLowerCase().startsWith('ksm-kgh-av')
                );
                const otherResources = resources.filter(item =>
                  !item.itemName?.toLowerCase().startsWith('ksm-kgh-video') &&
                  !item.itemName?.toLowerCase().startsWith('ksm-kgh-av')
                );

                return (
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left Column - AV Resources */}
                      <div>
                        {(ksmResources.length > 0 || otherResources.length === 0) && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-1 bg-gradient-to-b ${themeColors[8]} ${themeColors[9]} rounded-full`}></div>
                              <h4 className="text-lg font-bold text-black">
                                AV Resources
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${themeColors[4]} text-black`}>
                                {ksmResources.length}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {ksmResources.map((item, index) => (
                                <div
                                  key={`ksm-${index}`}
                                  className={`group bg-gradient-to-r ${themeColors[1]} ${themeColors[2]} rounded-xl p-3 ${themeColors.border2} hover:${themeColors.border4} hover:shadow-md transition-all duration-300`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${themeColors[8]} ${themeColors[9]} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300`}>
                                      {shouldUseZoomIcon(item.itemName) ? (
                                        <img
                                          src="/zoomicon.png"
                                          alt="Zoom"
                                          className="w-5 h-5 object-contain"
                                        />
                                      ) : (
                                        <span className="text-sm text-white font-bold">
                                          {getAVResourceIcon(item.itemName)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          {/* Display Name */}
                                          <h5 className="text-base font-semibold text-black mb-1 leading-tight">
                                            {getResourceDisplayName(item.itemName)}
                                          </h5>

                                          {/* Raw Name */}
                                          <p className="text-xs text-gray-500 font-medium mb-2 truncate">
                                            {item.itemName}
                                          </p>

                                          {/* Instructions */}
                                          {item.instruction && (
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                              {item.instruction}
                                            </p>
                                          )}
                                        </div>

                                        {/* Quantity Badge */}
                                        {item.quantity && item.quantity > 1 && (
                                          <div className="flex-shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${themeColors[8]} ${themeColors[9]} text-white shadow-sm`}>
                                              {item.quantity}x
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Other Resources */}
                      <div>
                        {otherResources.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-1 bg-gradient-to-b ${themeColors[6]} ${themeColors[7]} rounded-full`}></div>
                              <h4 className="text-lg font-bold text-black">
                                General Resources
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${themeColors[3]} text-black`}>
                                {otherResources.length}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {otherResources.map((item, index) => (
                                <div
                                  key={`other-${index}`}
                                  className={`group ${themeColors[1]} rounded-lg p-3 ${themeColors.border2} hover:${themeColors.border3} hover:shadow-sm transition-all duration-200`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      {/* Raw Name Only */}
                                      <p className="text-sm text-black font-medium">
                                        {item.itemName}
                                      </p>

                                      {/* Instructions */}
                                      {item.instruction && (
                                        <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                          {item.instruction}
                                        </p>
                                      )}
                                    </div>

                                    {/* Quantity Badge */}
                                    {item.quantity && item.quantity > 1 && (
                                      <div className="flex-shrink-0 ml-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${themeColors[4]} text-black`}>
                                          {item.quantity}x
                                        </span>
                                      </div>
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
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 