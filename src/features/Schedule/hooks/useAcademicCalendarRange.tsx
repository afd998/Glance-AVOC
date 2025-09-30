import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type AcademicCalendarItem = Database['public']['Tables']['academic_calendar']['Row'];

const fetchAcademicCalendarRange = async (startDate: Date, endDate: Date): Promise<AcademicCalendarItem[]> => {
  const { data, error } = await supabase
    .from('academic_calendar')
    .select('*')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

export const useAcademicCalendarRange = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['academic-calendar-range', startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: () => fetchAcademicCalendarRange(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!startDate && !!endDate, // Only run query if both dates are provided
  });
};

// Helper function to get academic calendar events for a specific date
export const getAcademicEventsForDate = (events: AcademicCalendarItem[], date: Date): AcademicCalendarItem[] => {
  const dateString = date.toISOString().split('T')[0];
  return events.filter(event => {
    if (!event.date) return false;
    const eventDateString = new Date(event.date).toISOString().split('T')[0];
    return eventDateString === dateString;
  });
};
