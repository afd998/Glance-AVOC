import React from 'react';
import { formatTime } from '../utils/timeUtils';

export default function EventHeader({ 
  event, 
  hasVideoRecording, 
  hasStaffAssistance, 
  hasHandheldMic, 
  hasWebConference 
}) {
  const timeDisplay = `${formatTime(event.start)} - ${formatTime(event.end)}`;

  return (
    <div className="flex justify-between items-center h-4">
      <span className="text-xs font-medium opacity-90 truncate">{timeDisplay}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {hasVideoRecording && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Video Recording"></span>
        )}
        {hasStaffAssistance && (
          <span className="text-xs bg-orange-500 dark:bg-orange-600 rounded-full p-0.5 shadow-sm" title="Staff Assistance">🚶</span>
        )}
        {hasHandheldMic && (
          <span className="text-sm" title="Handheld Microphone">🎤</span>
        )}
        {hasWebConference && (
          <img 
            src="/zoomicon.png" 
            alt="Web Conference" 
            className="w-4 h-4 object-contain dark:invert"
            title="Web Conference"
          />
        )}
      </div>
    </div>
  );
} 