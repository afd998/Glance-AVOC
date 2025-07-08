import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Fetch events from the API
const fetchEvents = async ({ queryKey }) => {
  const [_, date] = queryKey;

  try {
    // Calculate date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fortyDaysAgo = new Date(today);
    fortyDaysAgo.setDate(today.getDate() - 40);
    
    const fortyDaysAhead = new Date(today);
    fortyDaysAhead.setDate(today.getDate() + 40);
    
    // Check if date is within range
    const isWithinRange = date >= fortyDaysAgo && date <= fortyDaysAhead;
    
    if (isWithinRange) {
      // Use Supabase for recent dates
      const { data, error } = await supabase
        .from('25liveData')
        .select('events_data')
        .eq('scraped_date', date.toISOString().split('T')[0]);
        
      if (error) throw error;
      
      
      
      
      
      // If events_data is a string, parse it
      const eventsData = typeof data?.[0]?.events_data === 'string' 
        ? JSON.parse(data[0].events_data)
        : data?.[0]?.events_data || [];
        
      
      
      return eventsData;
    } else {
      // Use existing server API for older/future dates
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const url = `${apiUrl}/api/availability?date=${formattedDate}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
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
      // Ensure we have an array to work with
      const eventsArray = Array.isArray(eventsData) ? eventsData : 
                         (eventsData.events || eventsData.data || []);
      
      const processedEvents = eventsArray.map(event => ({
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
