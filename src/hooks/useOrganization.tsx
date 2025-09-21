import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Organization = Database['public']['Tables']['organizations']['Row'];

// Function to fetch organization by name
const fetchOrganization = async (organizationName: string): Promise<Organization | null> => {
  if (!organizationName) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', organizationName)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in fetchOrganization:', error);
    return null;
  }
};

// React Query hook for organization
export const useOrganization = (organizationName: string) => {
  return useQuery({
    queryKey: ['organization', organizationName],
    queryFn: () => fetchOrganization(organizationName),
    enabled: !!organizationName,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3
  });
};
