import { useQuery } from '@tanstack/react-query';

// Fetch events from the API
const fetchEvents = async () => {
  try {
    // Log the specific environment variable we're looking for
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      'process.env keys': Object.keys(process.env)
    });
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/availability';
    console.log('Using API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    // Fallback to local data if API fails
    return null;
  }
};

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Cache is kept for 30 minutes
    retry: 2, // Retry failed requests 2 times
  });
}; 