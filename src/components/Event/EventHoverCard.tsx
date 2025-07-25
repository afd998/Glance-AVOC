import React from 'react';
import { parseEventResources, getResourceIcon, getResourceDisplayName } from '../../utils/eventUtils';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface EventHoverCardProps {
  event: Event;
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  style: React.CSSProperties;
}

export default function EventHoverCard({ event, facultyMember, isFacultyLoading, style }: EventHoverCardProps) {
  // Parse event resources using the utility function
  const { resources } = parseEventResources(event);

  return (
    <div 
      className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg p-4 w-80 border border-gray-200 dark:border-gray-700 overflow-hidden relative animate-[slideDown_0.3s_ease-out]" 
      style={{ zIndex:60, ...style }}
    >
      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800"></div>
      <div className="relative animate-[scaleUp_0.3s_ease-out]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{event.event_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.start_time || '')}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Remove 25Live link for now since we don't have eventUrl in the new schema */}
          </div>
        </div>

        {event.lecture_title && (
          <div className="mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 break-words">{event.lecture_title}</p>
          </div>
        )}

        {event.event_type && (
          <div className="mb-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Type: {event.event_type}</p>
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

        {event.instructor_name && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 mt-3 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2">
              {facultyMember?.kelloggdirectory_image_url ? (
                <a 
                  href={facultyMember?.kelloggdirectory_bio_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                  title={`View ${event.instructor_name}'s bio`}
                >
                  <img 
                    src={facultyMember.kelloggdirectory_image_url} 
                    alt={event.instructor_name}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      console.error('Error loading faculty image:', facultyMember.kelloggdirectory_image_url);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </a>
              ) : (
                <span className="text-sm">👤</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.instructor_name}</p>
                {facultyMember?.kelloggdirectory_title && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{facultyMember.kelloggdirectory_title}</p>
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