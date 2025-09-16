import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Database } from '../../types/supabase';
import { formatTime } from '../../utils/timeUtils';
import { getEventThemeColors } from '../../utils/eventUtils';
import { useOccurrences } from '../../hooks/useOccurrences';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useEventOwnership } from '../../hooks/useCalculateOwners';
import { usePanoptoChecks } from '../../hooks/usePanoptoChecks';
import { useEvent } from '../../hooks/useEvent';
import { useEventResources, useEventDurationHours } from '../../hooks/useEvents';
import Avatar from '../Avatar';

type Event = Database['public']['Tables']['events']['Row'];

interface EventHeaderProps {
  event: Event;
  isHovering: boolean;
}

export default function EventHeader({ 
  event, 
  isHovering = false
}: EventHeaderProps) {
  // Get fresh event data from individual event cache (will use cache if available)
  const { data: freshEvent } = useEvent(event.id);
  
  // Use fresh event data if available, otherwise fall back to prop
  const currentEvent = freshEvent || event;
  
  // Get all occurrences of this event and isFirstSession flag
  const { data: occurrencesData } = useOccurrences(currentEvent);
  const occurrences = occurrencesData?.occurrences || [];
  const isFirstSession = occurrencesData?.isFirstSession || false;
  
  // Get ownership data including timeline
  const { data: ownershipData } = useEventOwnership(currentEvent);
  
  // Get timeline entries
  const timeline = ownershipData?.timeline || [];
  
  // Get Panopto checks functionality
  const { areAllChecksComplete, useEventChecksComplete } = usePanoptoChecks();
  
  // State to track if all Panopto checks are complete
  const [allChecksComplete, setAllChecksComplete] = React.useState(false);
  
  // Get parsed event resources and computed flags from cache
  const { data: resourcesData } = useEventResources(currentEvent.id);
  const resources = resourcesData?.resources || [];
  
  // Get pre-computed boolean flags from cache
  const hasVideoRecording = resourcesData?.hasVideoRecording || false;
  const hasStaffAssistance = resourcesData?.hasStaffAssistance || false;
  const hasHandheldMic = resourcesData?.hasHandheldMic || false;
  const hasWebConference = resourcesData?.hasWebConference || false;
  const hasClickers = resourcesData?.hasClickers || false;
  const hasAVNotes = resourcesData?.hasAVNotes || false;
  
  // Get theme colors for this event type
  const themeColors = getEventThemeColors(currentEvent);
  
  // Check if all Panopto checks are complete for this event (using React Query properly)
  const { isComplete, isLoading, error } = useEventChecksComplete(
    currentEvent.id,
    currentEvent.start_time || undefined,
    currentEvent.end_time || undefined,
    currentEvent.date || undefined
  );

  // Update state when completion status changes
  React.useEffect(() => {
    if (hasVideoRecording && !isLoading) {
      if (error) {
        console.error('Error checking completion status:', error);
        setAllChecksComplete(false);
      } else {
        setAllChecksComplete(isComplete);
      }
    } else if (!hasVideoRecording) {
      setAllChecksComplete(false);
    }
  }, [isComplete, isLoading, error, hasVideoRecording, currentEvent.id]);
  
  
  // State for fisheye effect
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const iconOrder = ['firstSession', 'videoRecording', 'staffAssistance', 'handheldMic', 'webConference', 'clickers', 'avNotes'];
  
  // Format start and end times from HH:MM:SS format
  const formatTimeFromISO = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      // Parse HH:MM:SS format
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      // If minutes are 00, show just the hour
      if (minutes === 0) {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric',
          hour12: true 
        });
      } else {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
      }
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return '';
    }
  };

  const timeDisplay = `${formatTimeFromISO(currentEvent.start_time)} - ${formatTimeFromISO(currentEvent.end_time)}`;

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(currentEvent.id);
  const isShortLecture = currentEvent.event_type === 'Lecture' && eventDurationHours < 2;

  // Calculate fisheye scale based on proximity to hovered icon
  const getFisheyeScale = useCallback((iconKey: string) => {
    if (!hoveredIcon) return 1;

    const hoveredIndex = iconOrder.indexOf(hoveredIcon);
    const currentIndex = iconOrder.indexOf(iconKey);

    if (hoveredIndex === -1 || currentIndex === -1) return 1;

    const distance = Math.abs(currentIndex - hoveredIndex);

    if (distance === 0) {
      // Hovered icon: 1.7x scale
      return 1.7;
    } else if (distance === 1) {
      // Adjacent icons: 1.3x scale
      return 1.3;
    } else {
      // Other icons: normal scale
      return 1;
    }
  }, [hoveredIcon, iconOrder]);

  // Hover handlers for fisheye effect
  const handleIconHover = useCallback((iconKey: string) => {
    setHoveredIcon(iconKey);
  }, []);

  const handleIconLeave = useCallback(() => {
    setHoveredIcon(null);
  }, []);



  

  return (
    <div className={`flex justify-between items-center h-5 py-0.5 transition-all duration-200 ease-in-out absolute ${isShortLecture ? 'top-0 left-1 right-0' : 'top-0 left-2 right-2'} z-50`}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span 
          className={`text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out ${
            event.event_type === 'Ad Hoc Class Meeting' 
              ? (isHovering ? 'text-white' : 'text-gray-600')
              : event.event_type === 'Lecture'
                ? 'text-black'
                : 'text-white'
          }`}
          title={timeDisplay}
          style={{
            transform: isHovering ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
        >
          {timeDisplay}
        </span>
      </div>
            <div className={`flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-in-out overflow-visible bg-black bg-opacity-20 backdrop-blur-sm rounded-md px-2 py-1 mt-2`}>
        {isFirstSession && (
          <span
            className="text-yellow-500 dark:text-yellow-400 text-xs font-bold transition-all duration-[250ms] ease-in-out cursor-pointer relative"
            title="First Session"
            style={{
              transform: `scale(${getFisheyeScale('firstSession') * 0.8})`,
              fontSize: `${getFisheyeScale('firstSession') * 0.8}em`
            }}
            onMouseEnter={() => handleIconHover('firstSession')}
            onMouseLeave={handleIconLeave}
          >
            !
            {hoveredIcon === 'firstSession' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none" style={{ fontSize: '12px' }}>
                First Session
              </span>
            )}
          </span>
        )}
        {currentEvent.event_type !== 'KEC' && hasVideoRecording && (
          <div
            className="relative rounded-full bg-red-500 transition-all duration-[250ms] ease-in-out cursor-pointer"
            title={allChecksComplete ? "Video Recording - All Checks Complete" : "Video Recording"}
            style={{
              width: `${10 * getFisheyeScale('videoRecording')}px`,
              height: `${10 * getFisheyeScale('videoRecording')}px`,
              animation: allChecksComplete ? 'none' : 'pulse 2s infinite'
            }}
            onMouseEnter={() => handleIconHover('videoRecording')}
            onMouseLeave={handleIconLeave}
          >
            {allChecksComplete && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{
                    width: `${7 * getFisheyeScale('videoRecording')}px`,
                    height: `${7 * getFisheyeScale('videoRecording')}px`
                  }}
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
            {hoveredIcon === 'videoRecording' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                {allChecksComplete ? "Video Recording - All Checks Complete" : "Video Recording"}
              </span>
            )}
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasStaffAssistance && (
          <div
            className="flex items-center justify-center rounded-full bg-green-500 bg-opacity-90 transition-all duration-[250ms] ease-in-out cursor-pointer relative"
            title="Staff Assistance"
            style={{
              width: `${13 * getFisheyeScale('staffAssistance')}px`,
              height: `${13 * getFisheyeScale('staffAssistance')}px`
            }}
            onMouseEnter={() => handleIconHover('staffAssistance')}
            onMouseLeave={handleIconLeave}
          >
            <span
              className="text-white transition-all duration-[250ms] ease-in-out"
              style={{
                fontSize: `${10 * getFisheyeScale('staffAssistance')}px`
              }}
            >
              🚶
            </span>
            {hoveredIcon === 'staffAssistance' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                Staff Assistance
              </span>
            )}
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasHandheldMic && (
          <span
            className="transition-all duration-[250ms] ease-in-out cursor-pointer relative"
            title="Handheld Microphone"
            style={{
              fontSize: `${getFisheyeScale('handheldMic') * 0.8}em`
            }}
            onMouseEnter={() => handleIconHover('handheldMic')}
            onMouseLeave={handleIconLeave}
          >
            🎤
            {hoveredIcon === 'handheldMic' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                Handheld Microphone
              </span>
            )}
          </span>
        )}
        {currentEvent.event_type !== 'KEC' && hasWebConference && (
          <div className="relative">
            <img
              src="/zoomicon.png"
              alt="Web Conference"
              className="object-contain dark:invert transition-all duration-[250ms] ease-in-out cursor-pointer"
              title="Web Conference"
              style={{
                width: `${10 * getFisheyeScale('webConference')}px`,
                height: `${10 * getFisheyeScale('webConference')}px`
              }}
              onMouseEnter={() => handleIconHover('webConference')}
              onMouseLeave={handleIconLeave}
            />
            {hoveredIcon === 'webConference' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                Web Conference
              </span>
            )}
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasClickers && (
          <div className="relative overflow-visible">
            <div
              className="bg-pink-400 rounded-full flex items-center justify-center transition-all duration-[250ms] ease-in-out cursor-pointer relative"
              style={{
                width: `${16 * getFisheyeScale('clickers')}px`,
                height: `${16 * getFisheyeScale('clickers')}px`
              }}
              onMouseEnter={() => handleIconHover('clickers')}
              onMouseLeave={handleIconLeave}
            >
              <img
                src="/tp.png"
                alt="Clickers"
                className="object-contain dark:invert transition-all duration-[250ms] ease-in-out"
                style={{
                  width: `${14 * getFisheyeScale('clickers')}px`,
                  height: `${14 * getFisheyeScale('clickers')}px`
                }}
                title="Clickers (Polling)"
              />
              {hoveredIcon === 'clickers' && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                  Clickers (Polling)
                </span>
              )}
            </div>
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasAVNotes && (
          <span
            className="text-xs transition-all duration-[250ms] ease-in-out cursor-pointer relative"
            title="AV Setup Notes"
            style={{
              fontSize: `${getFisheyeScale('avNotes') * 0.8}em`
            }}
            onMouseEnter={() => handleIconHover('avNotes')}
            onMouseLeave={handleIconLeave}
          >
            📝
            {hoveredIcon === 'avNotes' && (
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-[200] pointer-events-none">
                AV Setup Notes
              </span>
            )}
          </span>
        )}
        
        {/* Separator bar between resource icons and owner icons */}
        {(isFirstSession || hasVideoRecording || hasStaffAssistance || hasHandheldMic || hasWebConference || hasClickers || hasAVNotes) && timeline.length > 0 && (
          <div className="w-0.5 h-4 bg-white dark:bg-gray-800 mx-0.5 opacity-20"></div>
        )}
        
        {/* Owner Avatars */}
        {timeline.length > 0 && (
          <div className="flex items-center gap-0.5">
            {timeline.map((entry, index) => (
              <React.Fragment key={entry.ownerId}>
                {/* Owner Avatar */}
                <div 
                  className="transition-all duration-200 ease-in-out"
                  title={`Assigned to: ${entry.ownerId}`}
                  style={{
                    transform: isHovering ? 'scale(1.2)' : 'scale(1)'
                  }}
                >
                  <Avatar userId={entry.ownerId} size="xs" />
                </div>
                
                {/* Arrow (if not the last owner) */}
                {index < timeline.length - 1 && (
                  <svg 
                    className="w-3 h-3 text-gray-600 dark:text-gray-400 transition-all duration-200 ease-in-out" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{
                      transform: isHovering ? 'scale(1.2)' : 'scale(1)'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 