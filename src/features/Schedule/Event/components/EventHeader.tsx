import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Database } from '../../../../types/supabase';
import { formatTime } from '../../../../utils/timeUtils';
import { getEventThemeColors } from '../../../../utils/eventUtils';
import { useOccurrences } from '../../../../hooks/useOccurrences';
import { useUserProfile } from '../../../../core/User/useUserProfile';
import { useEventOwnership } from '../../../../core/event/hooks/useCalculateOwners';
import { useEventChecksComplete } from '../hooks/useEventChecksComplete';
import { useEvent } from '../../../../core/event/hooks/useEvent';
import { useEventResources, useEventDurationHours } from '../../hooks/useEvents';
import Avatar from '../../../../components/ui/Avatar';

type Event = Database['public']['Tables']['events']['Row'];

interface EventHeaderProps {
  eventId: number;
  date?: string;
  isHovering: boolean;
}

export default function EventHeader({ 
  eventId, 
  date,
  isHovering = false
}: EventHeaderProps) {
  // Get event data from useEvent hook (will use cache if available)
  const { data: currentEvent } = useEvent(eventId, date);
  
  // Early return if no event data
  if (!currentEvent) {
    return null;
  }

  // Get all occurrences of this event and isFirstSession flag
  const { data: occurrencesData } = useOccurrences(currentEvent);
  const occurrences = occurrencesData?.occurrences || [];
  const isFirstSession = occurrencesData?.isFirstSession || false;
  
  // Get ownership data including timeline
  const { data: ownershipData } = useEventOwnership(currentEvent.id);
  
  // Get timeline entries
  const timeline = ownershipData?.timeline || [];
  
  // Get Panopto checks functionality
  const { isComplete: allChecksComplete, isLoading: checksLoading } = useEventChecksComplete(
    currentEvent.id,
    currentEvent.start_time || undefined,
    currentEvent.end_time || undefined,
    currentEvent.date || undefined
  );
  
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

  
  
  // State for fisheye effect
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const iconOrder = ['firstSession', 'videoRecording', 'staffAssistance', 'handheldMic', 'webConference', 'clickers', 'avNotes'];
  
  // Format start and end times from HH:MM:SS format (memoized)
  const formatTimeFromISO = useCallback((timeString: string | null) => {
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
  }, []);

  // Memoize the time display calculation
  const timeDisplay = useMemo(() => {
    return `${formatTimeFromISO(currentEvent.start_time)} - ${formatTimeFromISO(currentEvent.end_time)}`;
  }, [formatTimeFromISO, currentEvent.start_time, currentEvent.end_time]);

  // Get cached event duration in hours
  const { data: eventDurationHours = 0 } = useEventDurationHours(currentEvent.id);
  const isShortLecture = currentEvent.event_type === 'Lecture' && eventDurationHours < 2;

  // Calculate fisheye scale based on proximity to hovered icon
  // DISABLED FOR GPU TESTING - fisheye scaling causes massive GPU usage
  const getFisheyeScale = useCallback((iconKey: string) => {
    // Always return 1 to disable all scaling effects that cause 95% GPU usage
    return 1;
  }, [hoveredIcon, iconOrder]);

  // Hover handlers for fisheye effect
  const handleIconHover = useCallback((iconKey: string) => {
    setHoveredIcon(iconKey);
  }, []);

  const handleIconLeave = useCallback(() => {
    setHoveredIcon(null);
  }, []);



  

  return (
    <div className={`flex justify-between items-center h-5 py-0.5 transition-all duration-200 ease-in-out absolute top-0 left-1 right-0 z-[100]`}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span 
          className={`text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out ${
            currentEvent.event_type === 'Ad Hoc Class Meeting' 
              ? (isHovering ? 'text-white' : 'text-gray-600')
              : currentEvent.event_type === 'Lecture'
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
      {/* Only show the container if there are resources or assignees */}
      {((isFirstSession || hasVideoRecording || hasStaffAssistance || hasHandheldMic || hasWebConference || hasClickers || hasAVNotes) || timeline.length > 0) && (
        <div className={`flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-in-out overflow-visible bg-black bg-opacity-20  rounded-md px-2 py-1 mt-2`}>
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
        {hasVideoRecording && (
          <div
            className="relative rounded-full bg-red-500 transition-all duration-[250ms] ease-in-out cursor-pointer"
            title={allChecksComplete ? "Video Recording - All Checks Complete" : "Video Recording"}
            style={{
              // DISABLED FOR GPU TESTING - fisheye scaling causes continuous GPU calculations
              width: `12px`, // Fixed size instead of: ${12 * getFisheyeScale('videoRecording')}px
              height: `12px`, // Fixed size instead of: ${12 * getFisheyeScale('videoRecording')}px
              // DISABLED FOR GPU TESTING - pulsing animation causes high GPU usage
              // animation: allChecksComplete ? 'none' : 'pulse 2s infinite'
            }}
            onMouseEnter={() => handleIconHover('videoRecording')}
            onMouseLeave={handleIconLeave}
          >
            {allChecksComplete && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 20 20"
                  style={{
                    // DISABLED FOR GPU TESTING - fisheye scaling causes continuous GPU calculations
                    width: `8px`, // Fixed size instead of: ${8 * getFisheyeScale('videoRecording')}px
                    height: `8px` // Fixed size instead of: ${8 * getFisheyeScale('videoRecording')}px
                  }}
                >
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
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
        {hasStaffAssistance && (
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
        {hasHandheldMic && (
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
        {hasWebConference && (
          <div className="relative">
            <img
              src="/zoomicon.png"
              alt="Web Conference"
              className="object-contain dark:invert transition-all duration-[250ms] ease-in-out cursor-pointer"
              title="Web Conference"
              style={{
                width: `${12 * getFisheyeScale('webConference')}px`,
                height: `${12 * getFisheyeScale('webConference')}px`
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
        {hasClickers && (
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
        {hasAVNotes && (
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
                    className="w-3 h-3 text-white transition-all duration-200 ease-in-out" 
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
      )}
    </div>
  );
} 