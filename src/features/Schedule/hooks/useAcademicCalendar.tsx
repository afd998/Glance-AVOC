import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';

type AcademicCalendarItem = Database['public']['Tables']['academic_calendar']['Row'];

const fetchAcademicCalendar = async (date: Date): Promise<AcademicCalendarItem[]> => {
  const formattedDate = date.toISOString().split('T')[0];
  
  // Create start and end of day in UTC to match database storage
  const startOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999));
  
  
  const { data, error } = await supabase
    .from('academic_calendar')
    .select('*')
    .gte('date', startOfDay.toISOString())
    .lte('date', endOfDay.toISOString());

  console.log('  Query Result:', { data, error });
  console.log('  Data length:', data?.length || 0);

  if (error) {
    throw error;
  }

  return data || [];
};

export const useAcademicCalendar = (date: Date) => {
  return useQuery({
    queryKey: ['academic-calendar', date.toISOString().split('T')[0]],
    queryFn: () => fetchAcademicCalendar(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    enabled: !!date, // Only run query if date is provided
  });
}; 