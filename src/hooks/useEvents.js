import { useQuery } from '@tanstack/react-query';

// Fetch events from the API
const fetchEvents = async ({ queryKey }) => {
  const [_, date] = queryKey;
  try {
    // Log the specific environment variable we're looking for
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      'process.env keys': Object.keys(process.env)
    });
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    const url = `${apiUrl}/api/availability?date=${date.toISOString().split('T')[0]}`;
    console.log('Using API URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    // Log the raw response
    console.log('Raw response:', response);
    
    const data = await response.json();
    // Log the parsed data
    console.log('Parsed response data:', data);
    console.log('Data type:', typeof data);
    console.log('Data structure:', {
      hasData: !!data.data,
      dataLength: data.data?.length,
      firstItem: data.data?.[0],
      keys: Object.keys(data)
    });

    // Log all room names from events
    console.log('All room names in events:', data.data?.map(event => ({
      subject_itemName: event.subject_itemName,
      containsL: event.subject_itemName?.includes('L'),
      containsGH: event.subject_itemName?.includes('GH'),
      fullString: JSON.stringify(event.subject_itemName)
    })));
    
    return data.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // Fallback to local data if API fails
    return null;
  }
};

export const useEvents = (date) => {
  return useQuery({
    queryKey: ['events', date],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache is kept for 30 minutes
    retry: 2, // Retry failed requests 2 times
  });
}; 