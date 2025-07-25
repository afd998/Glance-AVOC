import React from 'react';
import { Database } from '../../types/supabase';
import { formatTime } from '../../utils/timeUtils';
import { parseEventResources } from '../../utils/eventUtils';
import { useOccurrences } from '../../hooks/useOccurrences';

type Event = Database['public']['Tables']['events']['Row'];

interface EventHeaderProps {
  event: Event;
  isHovering: boolean;
}

export default function EventHeader({ 
  event, 
  isHovering = false
}: EventHeaderProps) {
  // Get all occurrences of this event
  const { data: occurrences } = useOccurrences(event.event_name);
  
  // Check if this is the first session (earliest occurrence) - only for lectures
  const isFirstSession = React.useMemo(() => {
    if (!occurrences || occurrences.length === 0 || event.event_type !== 'Lecture') return false;
    
    // Sort occurrences by start time and check if this event is the first one
    const sortedOccurrences = [...occurrences].sort((a, b) => {
      const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
      const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
      return timeA - timeB;
    });
    
    return sortedOccurrences[0]?.id === event.id;
  }, [occurrences, event.id, event.event_type]);
  
  // Parse event resources using the utility function
  const { resources } = parseEventResources(event);
  
  // Check for specific resources by display name
  const hasVideoRecording = resources.some(item => item.displayName?.includes('Recording'));
  const hasStaffAssistance = resources.some(item => item.displayName === 'Staff Assistance');
  const hasHandheldMic = resources.some(item => item.displayName === 'Handheld Microphone');
  const hasWebConference = resources.some(item => item.displayName === 'Web Conference');
  const hasClickers = resources.some(item => item.displayName === 'Clickers (Polling)');
  // Format start and end times from ISO strings
  const formatTimeFromISO = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
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

  const timeDisplay = `${formatTimeFromISO(event.start_time)} - ${formatTimeFromISO(event.end_time)}`;

  return (
    <div className="flex justify-between items-center h-4 transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span 
          className="text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out"
          title={timeDisplay}
          style={{
            transform: isHovering ? 'scale(1.1)' : 'scale(1)',
            transformOrigin: 'left center'
          }}
        >
          {timeDisplay}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-in-out">
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
        {hasVideoRecording && (
          <span 
            className="w-2 h-2 rounded-full bg-red-500 animate-pulse transition-all duration-200 ease-in-out" 
            title="Video Recording"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          ></span>
        )}
        {hasStaffAssistance && (
          <div 
            className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 bg-opacity-90 transition-all duration-200 ease-in-out"
            title="Staff Assistance"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            <span className="text-white text-xs">🚶</span>
          </div>
        )}
        {hasHandheldMic && (
          <span 
            className="text-sm transition-all duration-200 ease-in-out" 
            title="Handheld Microphone"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          >
            🎤
          </span>
        )}
        {hasWebConference && (
          <img 
            src="/zoomicon.png" 
            alt="Web Conference" 
            className="w-4 h-4 object-contain dark:invert transition-all duration-200 ease-in-out"
            title="Web Conference"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        )}
        {hasClickers && (
          <img 
            src="/tp.png" 
            alt="Clickers" 
            className="w-4 h-4 object-contain dark:invert transition-all duration-200 ease-in-out"
            title="Clickers (Polling)"
            style={{
              transform: isHovering ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        )}
      </div>
    </div>
  );
} 