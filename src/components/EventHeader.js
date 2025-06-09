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
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 bg-opacity-90">
            <span className="text-white text-xs">🚶</span>
          </div>
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