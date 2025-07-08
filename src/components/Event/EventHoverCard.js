import React from 'react';
import { parseEventResources, getResourceIcon, getResourceDisplayName } from '../../utils/eventUtils';
import { formatTime, formatDate } from '../../utils/timeUtils';

export default function EventHoverCard({ event, eventType, instructorName, facultyMember, isFacultyLoading, style, lectureTitle }) {
  // Parse event resources using the utility function
  const { resources } = parseEventResources(event);

  return (
    <div 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 border border-gray-200 dark:border-gray-700 overflow-hidden relative animate-[slideDown_0.3s_ease-out]" 
      style={{ zIndex:60 }}
    >
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800"></div>
      <div className="relative animate-[scaleUp_0.3s_ease-out]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{event.itemName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.subject_item_date)}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {event.eventUrl && (
              <a 
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 whitespace-nowrap"
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

        {lectureTitle && (
          <div className="mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{lectureTitle}</p>
          </div>
        )}

        {eventType && (
          <div className="mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Type: {eventType}</p>
          </div>
        )}

        {resources.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Resources:</h4>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              {resources.map((item, index) => (
                <li key={index} className="flex items-center gap-1">
                  <span className="flex-shrink-0">
                    {getResourceIcon(item.itemName)}
                  </span>
                  <span className="truncate">{getResourceDisplayName(item.itemName)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {instructorName && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 mt-3 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2">
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
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Error loading faculty image:', facultyMember.imageUrl);
                      e.target.style.display = 'none';
                    }}
                  />
                </a>
              ) : (
                <span className="text-sm">👤</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{instructorName}</p>
                {facultyMember?.title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{facultyMember.title}</p>
                )}
                {isFacultyLoading && (
                  <span className="text-xs text-gray-400">(Loading faculty info...)</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 