import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type AcademicCalendarItem = Database['public']['Tables']['academic_calendar']['Row'];

const fetchQuarterStartDates = async (): Promise<Date[]> => {
  const { data, error } = await supabase
    .from('academic_calendar')
    .select('date')
    .eq('start_of_quarter', true);

  if (error) {
    console.error('[useQuarterStartDates] Supabase error:', error);
    throw error;
  }

  // Convert date strings to Date objects and filter out null dates
  const dates = data
    ?.map(item => item.date)
    .filter(date => date !== null)
    .map(dateString => new Date(dateString as string))
    .filter(date => !isNaN(date.getTime())) || [];
  
  return dates;
};

export const useQuarterStartDates = () => {
  return useQuery({
    queryKey: ['quarter-start-dates'],
    queryFn: fetchQuarterStartDates,
    staleTime: Infinity, // Never goes stale - only invalidate on refresh
    gcTime: Infinity, // Keep in cache indefinitely
  });
}; 