import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type AcademicCalendarItem = Database['public']['Tables']['academic_calendar']['Row'];

const fetchQuarterStartDates = async (): Promise<Date[]> => {
  const { data, error } = await supabase
    .from('academic_calendar')
    .select('date')
    .eq('label', '10-Week/1st 5 Week Classes Begin');

  console.log('[QuarterCount] Raw data from Supabase:', data);
  if (error) {
    console.error('[QuarterCount] Supabase error:', error);
    throw error;
  }

  // Convert date strings to Date objects and filter out null dates
  const dates = data
    ?.map(item => item.date)
    .filter(date => date !== null)
    .map(dateString => new Date(dateString as string))
    .filter(date => !isNaN(date.getTime())) || [];

  console.log('[QuarterCount] Parsed quarter start dates:', dates);
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