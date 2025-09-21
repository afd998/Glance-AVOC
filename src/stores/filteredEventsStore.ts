import { create } from 'zustand';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface FilteredEventsState {
  // Store filtered events by a composite key: date-filter-userId
  filteredEventsByKey: Record<string, Event[]>;
  
  // Actions
  setFilteredEvents: (date: string, filter: string | null, userId: string | null, events: Event[]) => void;
  getFilteredEvents: (date: string, filter: string | null, userId: string | null) => Event[];
  clearFilteredEvents: () => void;
  getFilteredEventsForRoom: (date: string, filter: string | null, userId: string | null, roomName: string) => Event[];
}

// Helper function to create a composite key
const createKey = (date: string, filter: string | null, userId: string | null): string => {
  return `${date}-${filter || 'null'}-${userId || 'null'}`;
};

export const useFilteredEventsStore = create<FilteredEventsState>((set, get) => ({
  filteredEventsByKey: {},

  setFilteredEvents: (date, filter, userId, events) => {
    const key = createKey(date, filter, userId);
    set((state) => ({
      filteredEventsByKey: {
        ...state.filteredEventsByKey,
        [key]: events
      }
    }));
  },

  getFilteredEvents: (date, filter, userId) => {
    const key = createKey(date, filter, userId);
    return get().filteredEventsByKey[key] || [];
  },

  clearFilteredEvents: () => {
    set({ filteredEventsByKey: {} });
  },

  getFilteredEventsForRoom: (date, filter, userId, roomName) => {
    const events = get().getFilteredEvents(date, filter, userId);
    
    return events.filter((event: Event) => {
      if (!event.room_name) return false;
      
      // Handle merged rooms (e.g., "GH 1420&30")
      if (event.room_name.includes('&')) {
        const parts = event.room_name.split('&');
        if (parts.length === 2) {
          const baseRoom = parts[0].trim();
          
          // Merged room events should ONLY appear in the base room row
          // This prevents duplicate rendering in multiple room rows
          return baseRoom === roomName;
        }
      }
      
      // Direct room match
      return event.room_name === roomName;
    });
  }
}));
