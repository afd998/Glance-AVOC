import { useQuery } from '@tanstack/react-query';

// Function to search Panopto for recordings by title
const searchPanoptoRecording = async (eventName) => {
  if (!eventName) {
    console.log('No event name provided for Panopto search');
    return null;
  }

  console.log('🔍 Searching Panopto for recording:', eventName);

  try {
    // Panopto API endpoint for searching sessions
    const baseUrl = 'https://kellogg-northwestern.hosted.panopto.com/Panopto';
    const searchUrl = `${baseUrl}/api/v1/sessions/search?searchQuery=${encodeURIComponent(eventName)}`;
    
    console.log('🌐 Making API call to:', searchUrl);
    
    // Try to use existing browser session authentication
    const response = await fetch(searchUrl, {
      method: 'GET',
      credentials: 'include', // This will send cookies if user is logged into Panopto
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Panopto API error:', response.status, response.statusText);
      
      // If we get a 401/403, the user might not be logged into Panopto
      if (response.status === 401 || response.status === 403) {
        console.log('🔐 User not authenticated with Panopto. They may need to log in first.');
      }
      
      return null;
    }

    const data = await response.json();
    console.log('📦 Panopto search response data:', data);

    // The API should return an array of sessions
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('✅ Found', data.length, 'matching sessions');
      // Return the first matching session
      const firstSession = data[0];
      console.log('🎯 First session:', firstSession);
      
      const result = {
        id: firstSession.Id,
        title: firstSession.Name,
        description: firstSession.Description,
        duration: firstSession.Duration,
        createdDate: firstSession.CreatedDate,
        // Add other fields as needed
      };
      
      console.log('🎬 Returning recording data:', result);
      return result;
    }

    console.log('❌ No Panopto recordings found for:', eventName);
    return null;
    
  } catch (error) {
    console.error('💥 Error searching Panopto:', error);
    console.error('💥 Error details:', error.message);
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      console.log('🌐 CORS Error: This is expected in development. The Panopto API requires server-side integration.');
      return {
        error: 'CORS_BLOCKED',
        message: 'Panopto integration requires server-side implementation due to CORS restrictions.'
      };
    }
    
    return null;
  }
};

// React Query hook for Panopto recording search
export const usePanoptoRecording = (eventName) => {
  console.log('🎯 usePanoptoRecording hook called with eventName:', eventName);
  console.log('🎯 Hook enabled:', !!eventName);
  
  const query = useQuery({
    queryKey: ['panoptoRecording', eventName],
    queryFn: () => {
      console.log('🚀 Query function executing for:', eventName);
      return searchPanoptoRecording(eventName);
    },
    enabled: !!eventName,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    cacheTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: true, // Force refetch when component mounts
    refetchOnWindowFocus: false // Don't refetch on window focus
  });
  
  console.log('🎯 Query result:', {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isEnabled: query.isEnabled,
    isFetching: query.isFetching,
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt
  });
  
  return query;
};

// Helper function to construct Panopto viewer URL
export const getPanoptoViewerUrl = (recordingId) => {
  if (!recordingId) return null;
  return `https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=${recordingId}`;
}; 