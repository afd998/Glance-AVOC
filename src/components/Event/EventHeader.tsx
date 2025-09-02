import React from 'react';
import { Database } from '../../types/supabase';
import { formatTime } from '../../utils/timeUtils';
import { parseEventResources } from '../../utils/eventUtils';
import { useOccurrences } from '../../hooks/useOccurrences';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useEventOwnership } from '../../hooks/useCalculateOwners';
import { usePanoptoChecks } from '../../hooks/usePanoptoChecks';
import { useEvent } from '../../hooks/useEvent';
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
  
  // Get all occurrences of this event
  const { data: occurrences } = useOccurrences(currentEvent.event_name);
  
  // Get ownership data including timeline
  const { data: ownershipData } = useEventOwnership(currentEvent);
  
  // Get timeline entries
  const timeline = ownershipData?.timeline || [];
  
  // Get Panopto checks functionality
  const { areAllChecksComplete, useEventChecksComplete } = usePanoptoChecks();
  
  // State to track if all Panopto checks are complete
  const [allChecksComplete, setAllChecksComplete] = React.useState(false);
  
  // Parse event resources using the utility function
  const { resources } = parseEventResources(currentEvent);
  
  // Check for specific resources by display name
  const hasVideoRecording = resources.some(item => item.displayName?.includes('Recording'));
  
  // Check if all Panopto checks are complete for this event (using React Query properly)
  const { isComplete, isLoading, error } = useEventChecksComplete(
    currentEvent.id,
    currentEvent.start_time || undefined,
    currentEvent.end_time || undefined,
    currentEvent.date || undefined
  );

  // Update state when completion status changes
  React.useEffect(() => {
    console.log('EventHeader: Completion status update:', {
      eventId: currentEvent.id,
      hasVideoRecording,
      isLoading,
      error,
      isComplete,
      allChecksComplete
    });
    
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
  }, [isComplete, isLoading, error, hasVideoRecording, currentEvent.id, allChecksComplete]);
  
  // Check if this is the first session (earliest occurrence) - only for lectures
  const isFirstSession = React.useMemo(() => {
    if (!occurrences || occurrences.length === 0 || currentEvent.event_type !== 'Lecture') return false;
    
    // Sort occurrences by start time and check if this event is the first one
    const sortedOccurrences = [...occurrences].sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });
    
    return sortedOccurrences[0]?.id === currentEvent.id;
  }, [occurrences, currentEvent.id, currentEvent.event_type]);
  const hasStaffAssistance = resources.some(item => item.displayName === 'Staff Assistance');
  const hasHandheldMic = resources.some(item => item.displayName === 'Handheld Microphone');
  const hasWebConference = resources.some(item => item.displayName === 'Web Conference');
  const hasClickers = resources.some(item => item.displayName === 'Clickers (Polling)');
  const hasAVNotes = resources.some(item => item.displayName === 'AV Setup Notes');
  // Format start and end times from HH:MM:SS format
  const formatTimeFromISO = (timeString: string | null) => {
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

  const timeDisplay = `${formatTimeFromISO(currentEvent.start_time)} - ${formatTimeFromISO(currentEvent.end_time)}`;

  return (
    <div className="flex justify-between items-center h-4 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span 
          className="text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out text-white"
          title={timeDisplay}
          style={{
            transform: isHovering ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
        >
          {timeDisplay}
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 transition-all duration-200 ease-in-out">
        {isFirstSession && (
          <span 
            className="text-yellow-500 dark:text-yellow-400 text-sm font-bold transition-all duration-200 ease-in-out"
            title="First Session"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            !
          </span>
        )}
        {currentEvent.event_type !== 'KEC' && hasVideoRecording && (
          <div 
            className="relative w-3 h-3 rounded-full bg-red-500 transition-all duration-200 ease-in-out" 
            title={allChecksComplete ? "Video Recording - All Checks Complete" : "Video Recording"}
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)',
              animation: allChecksComplete ? 'none' : 'pulse 2s infinite'
            }}
          >
            {allChecksComplete && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  className="w-3 h-3 text-green-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasStaffAssistance && (
          <div 
            className="flex items-center justify-center w-3 h-3 rounded-full bg-green-500 bg-opacity-90 transition-all duration-200 ease-in-out"
            title="Staff Assistance"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            <span className="text-white text-[8px]">🚶</span>
          </div>
        )}
        {currentEvent.event_type !== 'KEC' && hasHandheldMic && (
          <span 
            className="text-xs transition-all duration-200 ease-in-out" 
            title="Handheld Microphone"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            🎤
          </span>
        )}
        {currentEvent.event_type !== 'KEC' && hasWebConference && (
          <img 
            src="/zoomicon.png" 
            alt="Web Conference" 
            className="w-3 h-3 object-contain dark:invert transition-all duration-200 ease-in-out"
            title="Web Conference"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        )}
        {currentEvent.event_type !== 'KEC' && hasClickers && (
          <img 
            src="/tp.png" 
            alt="Clickers" 
            className="w-3 h-3 object-contain dark:invert transition-all duration-200 ease-in-out"
            title="Clickers (Polling)"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        )}
        {currentEvent.event_type !== 'KEC' && hasAVNotes && (
          <span 
            className="text-xs transition-all duration-200 ease-in-out" 
            title="AV Setup Notes"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            📝
          </span>
        )}
                {/* Owner Avatars */}
        {timeline.length > 0 && (
          <div className="flex items-center gap-1">
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