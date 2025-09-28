import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import { getResourceDisplayName, getEventThemeColors, getEventThemeHexColors, getAVResourceIcon, truncateEventName, getEventTypeInfo } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';
import Avatar from '../../components/ui/Avatar';
import { useUserProfile } from '../../hooks/useUserProfile';
import OwnerDisplay from './OwnerDisplay';
import { FacultyAvatar } from '../../core/faculty/FacultyAvatar';

// Helper function to extract hex color from Tailwind bg class
const extractHexFromBgClass = (bgClass: string): string => {
  // Extract hex color from classes like 'bg-[#f0e8f5]' or 'bg-gray-50'
  const hexMatch = bgClass.match(/bg-\[#([a-fA-F0-9]{6})\]/);
  if (hexMatch) return `#${hexMatch[1]}`;

  // Handle standard Tailwind colors
  const colorMap: { [key: string]: string } = {
    'bg-white': '#ffffff',
    'bg-gray-50': '#f9fafb',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-200': '#e5e7eb',
    'bg-gray-300': '#d1d5db',
    'bg-gray-400': '#9ca3af',
    'bg-gray-500': '#6b7280',
    'bg-gray-600': '#4b5563',
    'bg-gray-700': '#374151',
    'bg-gray-800': '#1f2937',
    'bg-gray-900': '#111827',
    'bg-red-50': '#fef2f2',
    'bg-red-100': '#fee2e2',
    'bg-red-200': '#fecaca',
    'bg-red-300': '#fca5a5',
    'bg-red-400': '#f87171',
    'bg-red-500': '#ef4444',
    'bg-red-600': '#dc2626',
    'bg-red-700': '#b91c1c',
    'bg-red-800': '#991b1b',
    'bg-red-900': '#7f1d1d'
  };

  return colorMap[bgClass] || '#ffffff'; // Default to white if not found
};

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

// Helper function to extract last names from instructor names
const extractLastNames = (instructorNames: string[]): string => {
  return instructorNames.map(name => {
    // Split by space and get the last part (assuming it's the last name)
    const nameParts = name.trim().split(' ');
    return nameParts[nameParts.length - 1];
  }).join(', ');
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
  const themeHexColors = getEventThemeHexColors(event);
  
  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);

  const handleOccurrencesClick = () => {
    navigate(`/${date}/${event.id}/occurrences`);
  };
  // Extract hex color from theme colors for gradient
  const bgHexColor = extractHexFromBgClass(themeColors[6]);

  return (
    <div className=" rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-4 sm:p-6 mb-4 sm:mb-6" style={{ background: `linear-gradient(135deg, ${bgHexColor}, ${bgHexColor}dd)` }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 mb-4 lg:mb-0">
          {/* Background container for the first 3 elements with faculty photo */}
          <div className="backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/10 dark:border-white/5 shadow-lg" style={{ backgroundColor: `${bgHexColor}40` }}>
            <div className="flex items-center gap-4">
              {/* Left side - Faculty photos */}
              {instructorNames.length > 0 && (
                <div className="flex-shrink-0 relative">
                  <div className="flex flex-col items-center mb-4">
                    <div
                      onMouseEnter={() => setIsFacultyHovering(true)}
                      onMouseLeave={() => setIsFacultyHovering(false)}
                      className="backdrop-blur-sm bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-2 rounded-lg flex items-center justify-center z-20 relative border border-purple-300/20 shadow-lg"
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
                    <div className="absolute bottom-[-8px] left-[30%] transform -translate-x-1/2 text-[20px] leading-tight font-medium opacity-90 text-center whitespace-normal w-28 transition-all duration-200 uppercase flex flex-col items-center z-30" style={{
                      fontFamily: "'Olympus Mount', sans-serif",
                      color: "transparent",
                      background: "linear-gradient(-45deg, black 50%, white 50%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text"
                    }}>
                      {instructorNames.length === 1
                        ? (() => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorNames[0]);
                            const fullName = facultyMember?.kelloggdirectory_name || instructorNames[0];
                            const nameParts = fullName.split(' ');
                            const isLongName = fullName.length > 18; // Adjust threshold as needed
                            const fontSize = isLongName ? 'text-[16px]' : 'text-[20px]';
                            return nameParts.length >= 2 ? (
                              <>
                                <div className={`-ml-2 whitespace-nowrap ${fontSize}`}>{nameParts[0]}</div>
                                <div className={`ml-2 whitespace-nowrap ${fontSize}`}>{nameParts.slice(1).join(' ')}</div>
                              </>
                            ) : (
                              <div className={`whitespace-nowrap ${fontSize}`}>{fullName}</div>
                            );
                          })()
                        : instructorNames.map(name => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === name);
                            return facultyMember?.kelloggdirectory_name || name;
                          }).map(name => {
                            // Extract last name from "FirstName LastName" format for multiple instructors
                            const parts = name.split(' ');
                            return parts.length > 1 ? parts[parts.length - 1] : name;
                          }).join(', ')
                      }
                    </div>
                  </div>
                </div>
              )}
              
              {/* Right side - Event info */}
              <div className="flex-1">
                {/* Course Code - Beginning part in bold */}
                {event.event_name && (
                  <h1 className="text-2xl sm:text-4xl font-bold text-black mb-0.5 uppercase" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
                    {truncateEventName(event)}
                  </h1>
                )}
                
                {/* Lecture Title */}
                {event.lecture_title && (
                  <h2 className="text-lg sm:text-2xl font-medium text-black mb-2 ml-4 break-words" style={{ fontFamily: "'GoudyBookletter1911', serif" }}>
                    {event.lecture_title}
                  </h2>
                )}
                
                {/* Session Code */}
                <p className="text-xs sm:text-sm text-gray-600 mb-0" style={{ fontFamily: "'Pixellari', sans-serif" }}>
                  {event.event_name}
                </p>
              </div>
            </div>
          </div>
          
          {/* Room and Occurrences Row */}
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            {/* Room Section */}
            <div className="backdrop-blur-sm rounded-lg p-3 border border-white/10 dark:border-white/5 shadow-lg" style={{ background: `linear-gradient(135deg, ${bgHexColor}60, ${bgHexColor}80)` }}>
              <span className={`text-xs font-medium text-black mb-3 block`}>Room</span>
              <div className="backdrop-blur-sm rounded-lg px-3 py-2 border border-white/30 dark:border-white/20 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[3]}, ${themeHexColors[4]})` }}>
                <span className={`text-lg font-medium text-black`} style={{ fontFamily: "'Pixellari', sans-serif" }}>
                  {(event.room_name || 'Unknown').replace(/^GH\s+/i, '')}
                </span>
              </div>
            </div>

            {/* Occurrences Section with Date, Time, and Button */}
            <div className="backdrop-blur-sm rounded-lg p-2 z-20 relative border border-white/10 dark:border-white/5 shadow-lg" style={{ background: `linear-gradient(135deg, ${bgHexColor}30, ${bgHexColor}50)` }}>
              <span className={`text-xs font-medium text-black mb-1 block`}>Occurrences</span>
              <div className={`flex items-center gap-2 transition-all duration-200 hover:${themeColors[4]} cursor-pointer rounded-lg p-1 border-2 border-transparent hover:${themeColors[3]} hover:${themeColors[4]}`} onClick={handleOccurrencesClick}>
                <div className="flex flex-col items-center justify-center p-1 rounded-lg">
                  <svg className={`w-5 h-5 text-black mb-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg className={`w-5 h-5 text-black`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs sm:text-sm text-black mb-0">{formatDate(event.date || '')}</p>
                  <p className="text-xs sm:text-sm text-black">
                    {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)} <span className="text-xs text-gray-500">CST</span>
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
          <div className="backdrop-blur-sm rounded-lg p-2 mb-3 border border-white/10 dark:border-white/5 shadow-lg" style={{ background: `linear-gradient(135deg, ${bgHexColor}90, ${bgHexColor}aa)` }}>
            <h3 className={`text-xs font-semibold text-black mb-1 uppercase tracking-wide`}>
              Event Details
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {/* Department Name/Event Name */}
              <div>
                <span className={`text-xs font-medium text-black mb-0.5 block`}>Event</span>
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded inline-flex items-center justify-center ${themeColors[7]} text-black`}>
                  {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ?
                    getDepartmentName(event.event_name.substring(0, 4)) :
                    (event.event_name || 'Unknown')}
                </span>
              </div>

              {/* Event Type */}
              <div>
                <span className={`text-xs font-medium text-black mb-0.5 block`}>Type</span>
                <span className={`px-1.5 py-0.5 text-xs font-medium rounded inline-flex items-center justify-center ${themeColors[7]} text-black`}>
                  {event.event_type || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Resources Card */}
          {resources.length > 0 && (
            <div className="backdrop-blur-sm rounded-xl shadow-2xl border border-white/20 dark:border-white/10 overflow-visible" style={{ background: `linear-gradient(135deg, ${themeHexColors[3]}, ${themeHexColors[4]})` }}>
              {/* Header */}
              <div className="backdrop-blur-sm px-4 py-2 border-b border-white/10 dark:border-white/5" style={{ background: `linear-gradient(to right, ${themeHexColors[2]}, ${themeHexColors[3]})` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Resources
                  </h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${themeColors[8]} text-white`}>
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
                  <div className="p-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left Column - AV Resources */}
                      <div>
                        {(ksmResources.length > 0 || otherResources.length === 0) && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-1 bg-gradient-to-b ${themeColors[10]} ${themeColors[9]} rounded-full`}></div>
                              <h4 className="text-base font-bold text-white">
                                AV Resources
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${themeColors[7]} text-white`}>
                                {ksmResources.length}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {ksmResources.map((item, index) => (
                                <div
                                  key={`ksm-${index}`}
                                  className="group backdrop-blur-sm rounded-lg p-3 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 hover:shadow-lg transition-all duration-300" style={{ background: `linear-gradient(135deg, ${themeHexColors[5]}CC, ${themeHexColors[6]}AA)` }}>
                                  <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${themeColors[9]} ${themeColors[10]} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300`}>
                                      {getAVResourceIcon(item.itemName) === 'ZOOM_ICON' ? (
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
                                          <h5 className="text-base font-semibold text-white mb-1 leading-tight">
                                            {getResourceDisplayName(item.itemName)}
                                          </h5>

                                          {/* Raw Name */}
                                          <p className="text-xs text-gray-400 font-normal mb-1 truncate">
                                            {item.itemName}
                                          </p>

                                          {/* Instructions */}
                                          {item.instruction && (
                                            <p className="text-xs text-white leading-snug">
                                              {item.instruction}
                                            </p>
                                          )}
                                        </div>

                                        {/* Quantity Badge */}
                                        {item.quantity && item.quantity > 1 && (
                                          <div className="flex-shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${themeColors[9]} ${themeColors[10]} text-white shadow-sm`}>
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
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-1 bg-gradient-to-b ${themeColors[10]} ${themeColors[9]} rounded-full`}></div>
                              <h4 className="text-base font-bold text-white">
                                General Resources
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${themeColors[7]} text-white`}>
                                {otherResources.length}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {otherResources.map((item, index) => (
                                <div
                                  key={`other-${index}`}
                                  className="group backdrop-blur-sm rounded-lg p-3 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/20 hover:shadow-lg transition-all duration-200" style={{ background: `linear-gradient(135deg, ${themeHexColors[6]}CC, ${themeHexColors[7]}AA)` }}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      {/* Raw Name Only */}
                                      <p className="text-xs text-gray-300 font-normal">
                                        {item.itemName}
                                      </p>

                                      {/* Instructions */}
                                      {item.instruction && (
                                        <p className="text-xs text-white leading-snug mt-1">
                                          {item.instruction}
                                        </p>
                                      )}
                                    </div>

                                    {/* Quantity Badge */}
                                    {item.quantity && item.quantity > 1 && (
                                      <div className="flex-shrink-0 ml-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${themeColors[8]} text-white`}>
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