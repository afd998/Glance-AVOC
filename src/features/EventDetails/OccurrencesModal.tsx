import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { formatTime, formatDate } from '../../utils/timeUtils';

import { useEventResources } from '../../core/event/hooks/useEvent';
import { useOccurrences } from '../../hooks/useOccurrences';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { ItemGroup, Item, ItemMedia, ItemContent, ItemActions, ItemTitle, ItemDescription } from '@/components/ui/item';
import { Badge } from '@/components/ui/badge';

type Event = Database['public']['Tables']['events']['Row'];

// Helper function to convert HH:MM:SS strings into float hours for formatTime
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



const formatInstructorNames = (instructors: Event['instructor_names']): string => {
  if (!instructors) {
    return 'Instructor TBD';
  }

  if (Array.isArray(instructors)) {
    const readable = instructors.map((name) => String(name)).filter(Boolean);
    if (readable.length === 0) return 'Instructor TBD';
    if (readable.length <= 2) return readable.join(', ');
    return `${readable.slice(0, 2).join(', ')} +${readable.length - 2} more`;
  }

  if (typeof instructors === 'string' && instructors.trim().length > 0) {
    return instructors;
  }

  return 'Instructor TBD';
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
  totalCards,
}) => {
  const navigate = useNavigate();
  const { data: resourcesData } = useEventResources(event.id);
  const resources = resourcesData?.resources || [];


  const resourcesWithNotes = React.useMemo(
    () => resources.filter((resource: any) => Boolean(resource.instruction)),
    [resources]
  );

  const handleCardClick = React.useCallback(() => {
    const eventDate = event.date || '';
    navigate(`/${eventDate}/${event.id}`);
  }, [event.date, event.id, navigate]);

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div className="group relative" role="listitem">
      <Card
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="cursor-pointer  transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none"
      >
        <CardHeader className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">  {formatDate(event.date || '')} · {formatTime(timeToFloatHours(event.start_time))} - {formatTime(timeToFloatHours(event.end_time))}</CardTitle>
              <CardDescription>
            
             
              <p className=""> Room: {event.room_name || 'Unknown Room'}</p>
              <p className="">Instructors: {formatInstructorNames(event.instructor_names)}</p>
           
          
             
              {Boolean((event as any).section) && (
                <p className="text-sm text-gray-600 dark:text-gray-300">Section {(event as any).section}</p>
              )}
         
     

              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isCurrentEvent && (
                <Badge variant="affirmative">Current</Badge>
              )}
              <span className="">{index + 1} of {totalCards}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent >
         
            {resources.length > 0 && (
            <div className="">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Resources</p>
              <div className="mt-2">
                <ItemGroup>
                  {resources.map((resItem: any, resourceIndex: number) => (
                    <Item key={`${event.id}-resource-${resourceIndex}`} size="sm">
                      <ItemMedia variant="icon">
                        {resItem.icon}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{resItem.displayName}</ItemTitle>
                        {resItem.instruction && (
                          <ItemDescription title={resItem.instruction}>{resItem.instruction}</ItemDescription>
                        )}
                      </ItemContent>
                      {resItem.quantity && resItem.quantity > 1 && (
                        <ItemActions>
                          <span className="text-[10px] font-semibold uppercase">x{resItem.quantity}</span>
                        </ItemActions>
                      )}
                    </Item>
                  ))}
                </ItemGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


// Dialog-friendly content that doesn't rely on router params
export function OccurrencesDialogContent({ currentEvent }: { currentEvent: Event }) {
  const { data: occurrencesData, isLoading, error } = useOccurrences(currentEvent ?? null);
  const occurrences = occurrencesData?.occurrences || [];

  if (!currentEvent) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
        Event not found
      </div>
    );
  }

  return (
   
      <div
       
      >
        <div className="relative" >
          <div className="pointer-events-none absolute inset-0 opacity-40"  />
          <div className="relative px-8 py-6 text-gray-900 dark:text-gray-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-600/90 dark:text-gray-300/90">Occurrences</p>
                <h2 className="text-2xl font-semibold leading-snug sm:text-3xl">{currentEvent.event_name}</h2>
              </div>
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              
              >
                {currentEvent.event_type || 'Uncategorized'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 dark:bg-gray-900" >
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-transparent dark:border-gray-600" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200/70 bg-white px-6 py-8 text-center text-red-600 dark:border-red-500/40 dark:bg-gray-950/90 dark:text-red-300">
              Error loading occurrences
            </div>
          ) : occurrences && occurrences.length > 0 ? (
            <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1" role="list">
              {occurrences.map((event, index) => (
                <OccurrenceCard
                  key={event.id}
                  event={event}
                  index={index}
                  isCurrentEvent={event.id === currentEvent.id}
                  totalCards={occurrences.length}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300/80 bg-white px-6 py-10 text-center text-gray-600 dark:border-gray-700 dark:bg-gray-950/80 dark:text-gray-300">
              No occurrences found
            </div>
          )}
        </div>
      </div>
 
  );
}
