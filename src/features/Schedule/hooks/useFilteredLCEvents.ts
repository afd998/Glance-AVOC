import { useEvents } from "./useEvents";
import { useLCRooms } from "../../../core/Rooms/useRooms";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../../types/supabase";

type Event = Database['public']['Tables']['events']['Row'];

export function useFilteredLCEvents(date: Date) {
    const { data: events, isLoading, error, isFetching } = useEvents(date);
    const { data: LCrooms } = useLCRooms();
    
    // derived query — cached per combination
    const filteredQ = useQuery({
      queryKey: ['events:filteredLC', date.toISOString().split('T')[0]],
      queryFn: () => {
        if (!events || !LCrooms) return [];
        
        // Get array of LC room names
        const LCroomNames = LCrooms.map(room => room.name);
        
        // Filter events to only include those in Light Court rooms AND have resources
        const filteredEvents = events.filter((event: Event) => 
          event.room_name && 
          LCroomNames.includes(event.room_name) &&
          event.resources && 
          Array.isArray(event.resources) && 
          event.resources.length > 0
        );
        
        // Group filtered events by room_name
        const roomEventsMap = new Map<string, Event[]>();
        
        filteredEvents.forEach(event => {
          if (event.room_name) {
            if (!roomEventsMap.has(event.room_name)) {
              roomEventsMap.set(event.room_name, []);
            }
            roomEventsMap.get(event.room_name)!.push(event);
          }
        });
        
        // Convert to array of objects with room_name and events
        return Array.from(roomEventsMap.entries()).map(([room_name, events]) => ({
          room_name,
          events
        }));
      },
      enabled: events !== undefined && LCrooms !== undefined,
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60, // 1 hour
    });
  
    return {
      data: filteredQ.data,
      isLoading: filteredQ.isLoading || isLoading,
      error: filteredQ.error || error,
      isFetching: filteredQ.isFetching || isFetching
    };
  }
    
  