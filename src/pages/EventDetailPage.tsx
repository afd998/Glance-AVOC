import React, { useState } from 'react';
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom';
import { useMultipleFacultyMembers } from '../core/faculty/hooks/useFaculty';
import { useUpdateFacultySetupAttributes, useFacultySetup } from '../core/faculty/hooks/useFacultySetup';
import { useEvents } from '../features/Schedule/hooks/useEvents';
import { useEventOwnership } from '../core/event/hooks/useCalculateOwners';
import { getEventThemeColors, getEventThemeHexColors } from '../utils/eventUtils';
import { useEventResources } from '../features/Schedule/hooks/useEvents';
import EventDetailHeader from '../features/EventDetails/EventDetailHeader';
import SessionSetup from '../core/faculty/FacultyProfile';
import Panopto from '../features/PanoptoChecks/Panopto';
import { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface PanelOption {
  id: string;
  label: string;
  image: string;
}

// Helper function to parse instructor names from JSON
const parseInstructorNames = (instructorNamesJson: any): string[] => {
  if (!instructorNamesJson) return [];

  if (Array.isArray(instructorNamesJson)) {
    return instructorNamesJson.filter(name => typeof name === 'string' && name.trim() !== '');
  }

  if (typeof instructorNamesJson === 'string') {
    return [instructorNamesJson];
  }

  return [];
};

export default function EventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId, date } = useParams<{ eventId: string; date: string }>();
  const [collapsedProfiles, setCollapsedProfiles] = useState<Record<string, boolean>>({});
  
  // Deprecated: occurrences route overlay now handled by Dialog in header
  const isOccurrencesRoute = false;
  
  
  // Parse the date from URL params
  const selectedDate = !date 
    ? new Date() 
    : (() => {
        const [year, month, day] = date.split('-').map(Number);
        const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
        return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      })();
  
  // Get all events for the specific date (now returns data instead of events)
  const { data: filteredEvents, isLoading, error } = useEvents(selectedDate);

  // Find the specific event by ID
  const event = React.useMemo(() => {
    if (!filteredEvents || !eventId) return null;
    return filteredEvents.find((e: any) => e.id === parseInt(eventId, 10)) || null;
  }, [filteredEvents, eventId]);

  // Parse instructor names from JSON field
  const instructorNames = React.useMemo(() => {
    if (!event) return [];
    return parseInstructorNames(event.instructor_names);
  }, [event]);

  const { data: facultyMembers, isLoading: isFacultyLoading } = useMultipleFacultyMembers(instructorNames);
  const updateFacultySetupAttributes = useUpdateFacultySetupAttributes();
  
  // Get faculty setup data for the first faculty member (for panel modal updates)
  const firstFacultyMember = facultyMembers && facultyMembers.length > 0 ? facultyMembers[0] : null;
  const { data: facultySetup } = useFacultySetup(firstFacultyMember?.id || 0);
  
  // Get ownership data including hand-off times
  const { data: ownershipData, isLoading: isHandOffTimeLoading } = useEventOwnership(event?.id ?? null);
  
  // Use the first hand-off time if there are multiple
  const handOffTime = ownershipData?.handOffTimes && ownershipData.handOffTimes.length > 0 ? ownershipData.handOffTimes[0] : null;
  
  // Get parsed event resources from cache (only if event exists and has valid ID)
  const { data: resourcesData } = useEventResources(event?.id && event.id > 0 ? event.id : -1);
  const resources = event && resourcesData ? resourcesData.resources : [];
  
  // Check if this event has recording resources
  const hasRecordingResource = resources.some(resource => 
    resource.itemName?.toLowerCase().includes('panopto') ||
    resource.itemName?.toLowerCase().includes('recording')
  );
  
  // Get theme colors based on event type
  const themeColors = event ? getEventThemeColors(event) : null;
  const themeHexColors = event ? getEventThemeHexColors(event) : null;

  const handleBack = () => {
    navigate(`/${date}`);
  };



  if (isLoading || !event) {
    return null;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-600 dark:text-red-400">
          <h1 className="text-2xl font-bold mb-4">Error Loading Event</h1>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-transparent rounded-lg shadow-xl">
      {/* Close Button */}
      

      <div className="overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Main Content */}
            <div className="flex-1 w-full">
              <EventDetailHeader
                event={event}
                facultyMembers={facultyMembers || []}
                instructorNames={instructorNames}
                isFacultyLoading={isFacultyLoading}
                resources={resources}
                handOffTime={handOffTime || null}
                isHandOffTimeLoading={isHandOffTimeLoading}
              />
              
              {/* Panopto Recording Checks Timeline - Show if event has recording resources */}
              {hasRecordingResource && (
                <Panopto event={event} />
              )}
              
              {/* Session Setup Components - One for each instructor */}
              {instructorNames.length > 0 && instructorNames.map((instructorName, index) => {
                const facultyMember = facultyMembers?.find(fm => fm.twentyfivelive_name === instructorName);
                const displayName = facultyMember?.kelloggdirectory_name || instructorName;
                const lastName = displayName?.split(' ').pop() || displayName;
                const isCollapsed = Boolean(collapsedProfiles[instructorName]);
                return (
                  <div key={`session-setup-${index}`} className="  bg-background text-foreground  rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-3 sm:p-6 mb-8">
                    <div
                      className="flex items-center justify-between mb-4 cursor-pointer"
                      onClick={() => setCollapsedProfiles(prev => ({ ...prev, [instructorName]: !isCollapsed }))}
                    >
                      <h2 className="text-lg sm:text-xl font-semibold ">
                        Faculty Profile{lastName ? ` - ${lastName}` : ''}
                      </h2>
                      <button
                        className="flex items-center justify-center w-8 h-8 backdrop-blur-sm bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 border border-white/20 dark:border-white/10 rounded-full transition-colors shadow-lg"
                        aria-label={isCollapsed ? "Expand session setup" : "Collapse session setup"}
                      >
                        <svg
                          className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {!isCollapsed && (
                      <SessionSetup
                        event={event}
                        resources={resources}
                        facultyMembers={facultyMember ? [facultyMember] : []}
                        instructorNames={[instructorName]}
                        isFacultyLoading={isFacultyLoading}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Occurrences overlay removed; now handled by Dialog in EventDetailHeader */}
    </div>
  );
} 