import { useQuery } from '@tanstack/react-query';

// Function to search Panopto for recordings by title
const searchPanoptoRecording = async (eventName) => {
  if (!eventName) {
    return null;
  }

  try {
    // Panopto API endpoint for searching sessions
    const baseUrl = 'https://kellogg-northwestern.hosted.panopto.com/Panopto';
    const searchUrl = `${baseUrl}/api/v1/sessions/search?searchQuery=${encodeURIComponent(eventName)}`;
    
    // Try to use existing browser session authentication
    const response = await fetch(searchUrl, {
      method: 'GET',
      credentials: 'include', // This will send cookies if user is logged into Panopto
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Panopto API error:', response.status, response.statusText);
      
      // If we get a 401/403, the user might not be logged into Panopto
      if (response.status === 401 || response.status === 403) {
        // User needs to log into Panopto
      }
      
      return null;
    }

    const data = await response.json();

    // The API should return an array of sessions
    if (data && Array.isArray(data) && data.length > 0) {
      // Return the first matching session
      const firstSession = data[0];
      
      const result = {
        id: firstSession.Id,
        title: firstSession.Name,
        description: firstSession.Description,
        duration: firstSession.Duration,
        createdDate: firstSession.CreatedDate,
        // Add other fields as needed
      };
      
      return result;
    }

    return null;
    
  } catch (error) {
    console.error('💥 Error searching Panopto:', error);
    console.error('💥 Error details:', error.message);
    
    // Check if it's a CORS error
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
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
  const query = useQuery({
    queryKey: ['panoptoRecording', eventName],
    queryFn: () => {
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
  
  return query;
};

// Helper function to construct Panopto viewer URL
export const getPanoptoViewerUrl = (recordingId) => {
  if (!recordingId) return null;
  return `https://kellogg-northwestern.hosted.panopto.com/Panopto/Pages/Viewer.aspx?id=${recordingId}`;
}; 
