import React from 'react';

export default function EventHoverCard({ event, matchingReservation, eventType, instructorName, facultyMember, isFacultyLoading, style, lectureTitle }) {
  const formatTime = (floatHours) => {
    const hours = Math.floor(floatHours);
    const minutes = Math.round((floatHours - hours) * 60);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-xl p-4 min-w-[300px] max-w-[400px] border border-gray-200"
      style={style}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="border-b pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 whitespace-normal break-words overflow-wrap-anywhere">{event.itemName}</h3>
              {lectureTitle && (
                <p className="text-sm text-gray-700 whitespace-normal break-words overflow-wrap-anywhere">{lectureTitle}</p>
              )}
              <p className="text-sm text-gray-600">{formatDate(event.subject_item_date)}</p>
            </div>
            {event.eventUrl && (
              <a 
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                title="View in 25Live"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                View in 25Live
              </a>
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 flex-shrink-0">🕒</span>
          <span className="text-gray-700 whitespace-normal break-words overflow-wrap-anywhere">
            {formatTime(event.start)} - {formatTime(event.end)}
          </span>
        </div>

        {/* Room */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 flex-shrink-0">🏢</span>
          <span className="text-gray-700 whitespace-normal break-words overflow-wrap-anywhere">{event.subject_itemName}</span>
        </div>

        {/* Event Type */}
        {eventType && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 flex-shrink-0">📋</span>
            <span className="text-gray-700 whitespace-normal break-words overflow-wrap-anywhere">{eventType}</span>
          </div>
        )}

        {/* Instructor */}
        {instructorName && (
          <div className="flex items-center gap-3">
            {facultyMember?.imageUrl ? (
              <a 
                href={facultyMember?.bioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
                title={`View ${instructorName}'s bio`}
              >
                <img 
                  src={facultyMember.imageUrl} 
                  alt={instructorName}
                  className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
                  onError={(e) => {
                    console.error('Error loading faculty image:', facultyMember.imageUrl);
                    e.target.style.display = 'none';
                  }}
                />
              </a>
            ) : (
              <span className="text-gray-500 flex-shrink-0">👤</span>
            )}
            <div className="min-w-0 flex-1">
              {facultyMember?.bioUrl ? (
                <a 
                  href={facultyMember.bioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 block whitespace-normal break-words overflow-wrap-anywhere hover:text-blue-600 transition-colors cursor-pointer"
                  title={`View ${instructorName}'s bio`}
                >
                  {instructorName}
                </a>
              ) : (
                <span className="text-gray-700 block whitespace-normal break-words overflow-wrap-anywhere">
                  {instructorName}
                </span>
              )}
              {facultyMember?.title && (
                <p className="text-xs text-gray-500 whitespace-normal break-words overflow-wrap-anywhere">{facultyMember.title}</p>
              )}
              {isFacultyLoading && (
                <span className="text-xs text-gray-400">(Loading faculty info...)</span>
              )}
            </div>
          </div>
        )}

        {/* Resources */}
        {matchingReservation.res && matchingReservation.res.length > 0 && (
          <div className="border-t pt-2">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Resources:</h4>
            <ul className="space-y-1">
              {matchingReservation.res.map((resource, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="flex-shrink-0">
                    {(resource.itemName === "KSM-KGH-VIDEO-Recording (POST TO CANVAS)" || 
                      resource.itemName === "KSM-KGH-VIDEO-Recording (PRIVATE LINK)" ||
                      resource.itemName === "KSM-KGH-VIDEO-Recording") && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                    {resource.itemName === "KSM-KGH-AV-Staff Assistance" && (
                      <span>🚶</span>
                    )}
                    {resource.itemName === "KSM-KGH-AV-Handheld Microphone" && (
                      <span>🎤</span>
                    )}
                    {resource.itemName === "KSM-KGH-AV-Web Conference" && (
                      <img 
                        src="/zoomicon.png" 
                        alt="Web Conference" 
                        className="w-4 h-4 object-contain"
                        title="Web Conference"
                      />
                    )}
                  </div>
                  <span className="whitespace-normal break-words overflow-wrap-anywhere">{resource.itemName}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 