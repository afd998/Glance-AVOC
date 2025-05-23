import React from "react";

export default function Event({ room, startTime, endTime, label, startHour, pixelsPerMinute, rooms }) {
  const roomIndex = rooms.indexOf(room);
  if (roomIndex === -1) return null;

  const startMinutes = (startTime.getHours() - startHour) * 60 + startTime.getMinutes();
  const endMinutes = (endTime.getHours() - startHour) * 60 + endTime.getMinutes();
  const durationMinutes = endMinutes - startMinutes;

  // Determine event type and color
  const isClass = label.includes("Class");
  const isMeeting = label.toLowerCase().includes("meeting");
  const isSpecial = label.includes("Workshop") || label.includes("Summit");
  
  let bgColor = "bg-blue-500";
  if (isClass) bgColor = "bg-indigo-500";
  if (isMeeting) bgColor = "bg-green-500";
  if (isSpecial) bgColor = "bg-purple-500";

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;

  return (
    <div
      className={`absolute ${bgColor} text-white text-xs rounded px-1 py-0.5 hover:opacity-90 transition-all cursor-pointer group`}
      style={{
        top: `${roomIndex * 40}px`,
        left: `${startMinutes * pixelsPerMinute}px`,
        width: `${durationMinutes * pixelsPerMinute}px`,
       
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
      title={label}
    >
      <div className="flex flex-col">
        <span className="text-[10px] opacity-75">{timeDisplay}</span>
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}