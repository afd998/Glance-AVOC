import React from 'react';
import { Database } from '../../types/supabase';
import { formatTime } from '../../utils/timeUtils';

type Event = Database['public']['Tables']['events']['Row'];

interface EventHeaderProps {
  event: Event;
  hasVideoRecording: boolean;
  hasStaffAssistance: boolean;
  hasHandheldMic: boolean;
  hasWebConference: boolean;
  hasClickers: boolean;
  isHovering: boolean;
}

export default function EventHeader({ 
  event, 
  hasVideoRecording, 
  hasStaffAssistance, 
  hasHandheldMic, 
  hasWebConference,
  hasClickers,
  isHovering = false
}: EventHeaderProps) {
  // Format start and end times from ISO strings
  const formatTimeFromISO = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      // Adjust for timezone offset since timestamps are stored as Chicago time
      // but JavaScript interprets them as UTC
      const timezoneOffset = date.getTimezoneOffset() * 60 * 1000; // Convert minutes to milliseconds
      const adjustedDate = new Date(date.getTime() + timezoneOffset);
      return adjustedDate.toLocaleTimeString('en-US', { 
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
      <span 
        className="text-xs font-medium opacity-90 truncate transition-all duration-200 ease-in-out"
        style={{
          transform: isHovering ? 'scale(1.1)' : 'scale(1)',
          transformOrigin: 'left center'
        }}
      >
        {timeDisplay}
      </span>
      <div className="flex items-center gap-1 flex-shrink-0 transition-all duration-200 ease-in-out">
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