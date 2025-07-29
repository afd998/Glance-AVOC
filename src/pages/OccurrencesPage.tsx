import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { formatTime, formatDate } from '../utils/timeUtils';
import { parseEventResources, getResourceIcon, getResourceDisplayName } from '../utils/eventUtils';

type Event = Database['public']['Tables']['events']['Row'];

// Helper function to convert HH:MM:SS time string to float hours for formatTime
const timeToFloatHours = (timeString: string | null): number => {
  if (!timeString) return 0;
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  } catch (error) {
    console.error('Error converting time to float hours:', timeString, error);
    return 0;
  }
};

interface OccurrenceCardProps {
  event: Event;
  index: number;
  isCurrentEvent: boolean;
  totalCards: number;
}

const OccurrenceCard: React.FC<OccurrenceCardProps> = ({ 
  event, 
  index, 
  isCurrentEvent, 
  totalCards 
}) => {
  const navigate = useNavigate();
  // Parse event resources
  const { resources } = parseEventResources(event);

  const handleCardClick = () => {
    const eventDate = event.date || '';
    navigate(`/${eventDate}/${event.id}`);
  };

  return (
    <div className="w-full transition-all duration-300 ease-out transform-gpu">
      <div 
        className={`rounded-lg shadow-lg p-4 border cursor-pointer hover:shadow-xl transition-all ${
          isCurrentEvent 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
        onClick={handleCardClick}
      >
        <div className="flex gap-4">
          {/* Left Column - Basic Info */}
          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatDate(event.date || '')}
              </p>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                {formatTime(timeToFloatHours(event.start_time))} - {formatTime(timeToFloatHours(event.end_time))}
              </p>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                {event.room_name || 'Unknown Room'}
              </p>
              {event.instructor_name && (
                <p className="text-gray-600 dark:text-gray-400">
                  {event.instructor_name}
                </p>
              )}
            </div>
          </div>
          
          {/* Right Column - Resources */}
          <div className="flex-1">
            {isCurrentEvent && (
              <div className="mb-3 flex justify-end">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                  Current
                </span>
              </div>
            )}
            {resources.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Resources:</p>
                <div className="flex flex-col gap-1">
                  {resources.map((item, index) => (
                    <div 
                      key={`${event.id}-resource-${index}`} 
                      className="flex flex-col gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 text-sm">
                          {getResourceIcon(item.itemName)}
                        </span>
                        <span className="font-medium">{getResourceDisplayName(item.itemName)}</span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="ml-1 px-1 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                      {item.instruction && (
                        <div 
                          className="text-xs text-blue-600 dark:text-blue-400 mt-1 pl-6 max-w-[200px] truncate"
                          title={item.instruction}
                        >
                          {item.instruction}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OccurrencesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  // First, get the current event to get its event_name
  const { data: currentEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<Event | null> => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', parseInt(eventId))
        .single();

      if (error) {
        console.error('Error fetching current event:', error);
        throw error;
      }

      return data;
    },
    enabled: !!eventId,
  });

  // Then, get all occurrences with the same event_name
  const { data: occurrences, isLoading, error } = useQuery({
    queryKey: ['occurrences', currentEvent?.event_name],
    queryFn: async (): Promise<Event[]> => {
      if (!currentEvent?.event_name) {
        return [];
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_name', currentEvent.event_name)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching occurrences:', error);
        throw error;
      }

      console.log('Occurrences query result:', data);
      return data || [];
    },
    enabled: !!currentEvent?.event_name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleClose = () => {
    navigate(-1);
  };

  if (!currentEvent) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6">
        <div className="text-center py-8 text-gray-500">
          Event not found
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-transparent w-full max-w-2xl max-h-[80vh] overflow-visible">
      {/* Header */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-t-xl shadow-lg flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {currentEvent?.event_name} - Occurrences
        </h2>
        <button
          onClick={handleClose}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-b-xl shadow-lg p-6 overflow-y-auto max-h-[calc(80vh-120px)] overflow-x-visible">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error loading occurrences
          </div>
        ) : occurrences && occurrences.length > 0 ? (
          <div className="relative h-96 overflow-y-auto">
            <div className="relative w-full px-8 py-12" style={{ minHeight: `${occurrences.length * 120}px` }}>
                              {occurrences.map((event, index) => (
                  <div
                    key={event.id}
                    className="group relative mb-4 transition-all duration-300 ease-out hover:z-50"
                    onMouseEnter={(e) => {
                      const target = e.currentTarget;
                      target.style.zIndex = '9999';
                      target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget;
                      target.style.zIndex = '';
                      target.style.transform = '';
                    }}
                  >
                  <OccurrenceCard
                    event={event}
                    index={index}
                    isCurrentEvent={event.id === parseInt(eventId || '0')}
                    totalCards={occurrences.length}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No other occurrences found
          </div>
        )}
      </div>
    </div>
  );
} 