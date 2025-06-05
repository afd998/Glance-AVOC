import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Fetch events from the API
const fetchEvents = async ({ queryKey }) => {
  const [_, date] = queryKey;
  console.log('useEvents - Date received:', {
    date,
    type: typeof date,
    isDate: date instanceof Date,
    isoString: date?.toISOString(),
    dateString: date?.toDateString()
  });
  
  try {
    // Log the specific environment variable we're looking for
    console.log('Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      'process.env keys': Object.keys(process.env)
    });
    
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    // Format date in local timezone to prevent UTC shift
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    const url = `${apiUrl}/api/availability?date=${formattedDate}`;
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

const getEventType = (data) => {
  const panels = data.itemDetails?.defn?.panel || [];
  for (const panel of panels) {
    if (panel.typeId === 11) {
      const eventType = panel.item?.[2]?.itemName;
      if (eventType) return eventType;
    }
  }
  return null;
};

const getInstructorName = (data) => {
  const panels = data.itemDetails?.defn?.panel || [];
  for (const panel of panels) {
    if (panel.typeId === 12) {
      const instructor = panel.item?.[0]?.itemName;
      if (instructor) {
        const cleanName = instructor.replace(/^Instructors:\s*/, '').trim();
        if (cleanName && 
            !cleanName.startsWith('<') && 
            cleanName.length > 2 && 
            cleanName.length < 100 && 
            !cleanName.includes('{') && 
            !cleanName.includes('}')) {
          return cleanName;
        }
      }
    }
    if (panel.typeId === 13) {
      const instructor = panel.item?.[0]?.item?.[0]?.itemName;
      if (instructor) {
        const cleanName = instructor.replace(/^Instructors:\s*/, '').trim();
        if (cleanName && 
            !cleanName.startsWith('<') && 
            cleanName.length > 2 && 
            cleanName.length < 100 && 
            !cleanName.includes('{') && 
            !cleanName.includes('}')) {
          return cleanName;
        }
      }
    }
  }
  return null;
};

const getLectureTitle = (data) => {
  const panels = data.itemDetails?.defn?.panel || [];
  for (const panel of panels) {
    if (panel.typeId === 11 && panel.item?.[1]?.itemName) {
      return panel.item[1].itemName;
    }
  }
  return null;
};

export function useEvents(startDate, endDate) {
  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['events', startDate, endDate],
    queryFn: () => fetchEvents({ queryKey: ['events', startDate, endDate] }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (eventsData) {
      const processedEvents = eventsData.map(event => ({
        ...event,
        eventType: getEventType(event),
        instructorName: getInstructorName(event),
        lectureTitle: getLectureTitle(event)
      }));
      setEvents(processedEvents);
    }
  }, [eventsData]);

  return { events, isLoading, error };
} 