import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';
import { useAllShiftBlocks } from './useShiftBlocks';
import { isUserEventOwner } from '../utils/eventUtils';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export const useMyEventsFilter = (events: Event[] | undefined) => {
  const { user } = useAuth();
  const { currentFilter } = useProfile();
  const { data: allShiftBlocks = [] } = useAllShiftBlocks();

  const myEvents = useMemo(() => {
    if (!events || events.length === 0 || currentFilter !== 'My Events' || !user) {
      return events || [];
    }

    // Filter events to only show those where the current user is an owner
    return events.filter(event => {
      return isUserEventOwner(event, user.id, allShiftBlocks);
    });
  }, [events, currentFilter, user, allShiftBlocks]);

  return {
    myEvents,
    isLoading: false // The shift blocks loading is handled by useAllShiftBlocks
  };
}; 