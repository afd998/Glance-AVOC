import React, { useState } from 'react';
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom';
import { useMultipleFacultyMembers, useUpdateFacultyAttributes } from '../../hooks/useFaculty';
import { useEvents } from '../../hooks/useEvents';
import { useEventOwnership } from '../Event/hooks/useCalculateOwners';
import { getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';
import { useEventResources } from '../../hooks/useEvents';
import EventDetailHeader from './EventDetailHeader';
import SessionSetup from '../Faculty/SessionSetup';
import Panopto from './Panopto';
import PanelModal from './PanelModal';
import OccurrencesPage from '../../pages/OccurrencesPage';
import { Database } from '../../types/supabase';

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
  
  // Check if we're on the occurrences route
  const isOccurrencesRoute = location.pathname.endsWith('/occurrences');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<'left' | 'right' | null>(null);
  
  // Panel image options
  const panelOptions: PanelOption[] = [
    { id: 'ROOM_PC', label: 'Room PC', image: '/panel-images/ROOM_PC.png' },
    { id: 'DOC_CAM', label: 'Document Camera', image: '/panel-images/DOC_CAM.png' },
    { id: 'LAPTOP_1', label: 'Laptop 1', image: '/panel-images/LAPTOP_1.png' },
    { id: 'LAPTOP_2', label: 'Laptop 2', image: '/panel-images/LAPTOP_2.png' },
    { id: 'LAPTOP_3', label: 'Laptop 3', image: '/panel-images/LAPTOP_3.png' },
    { id: 'PC_EXT', label: 'PC Extension', image: '/panel-images/PC_EXT.png' },
  ];
  
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
  const updateFacultyAttributes = useUpdateFacultyAttributes();
  
  // Get ownership data including hand-off times
  const { data: ownershipData, isLoading: isHandOffTimeLoading } = useEventOwnership(event?.id);
  
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

  const openPanelModal = (panel: 'left' | 'right') => {
    setEditingPanel(panel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPanel(null);
  };

  const selectPanelImage = (imageId: string) => {
    if (!editingPanel || !facultyMembers || facultyMembers.length === 0 || !event) return;

    // For multiple instructors, update the first one found
    // In a real application, you might want to show a selector for which instructor to update
    const facultyMember = facultyMembers[0];

    const updatedAttributes = {
      timing: facultyMember.timing ?? 0,
      complexity: facultyMember.complexity ?? 0,
      temperment: facultyMember.temperment ?? 0,
      uses_mic: facultyMember.uses_mic ?? false,
      left_source: facultyMember.left_source ?? '',
      right_source: facultyMember.right_source ?? '',
      setup_notes: facultyMember.setup_notes ?? '',
      [editingPanel === 'left' ? 'left_source' : 'right_source']: imageId
    };

    updateFacultyAttributes.mutate({
      twentyfiveliveName: facultyMember.twentyfivelive_name || '',
      attributes: updatedAttributes
    });

    closeModal();
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
    <div className="relative min-h-screen">
      {/* Close Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 backdrop-blur-sm bg-white/20 dark:bg-black/20 text-gray-600 dark:text-gray-300 rounded-full hover:bg-white/30 dark:hover:bg-black/30 border border-white/20 dark:border-white/10 transition-colors shadow-lg"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-4 sm:p-6 overflow-y-auto max-h-screen">
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
                return (
                  <SessionSetup
                    key={`session-setup-${index}`}
                    event={event}
                    resources={resources}
                    facultyMembers={facultyMember ? [facultyMember] : []}
                    instructorNames={[instructorName]}
                    isFacultyLoading={isFacultyLoading}
                    updateFacultyAttributes={updateFacultyAttributes}
                    openPanelModal={openPanelModal}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <PanelModal
        isModalOpen={isModalOpen}
        editingPanel={editingPanel}
        panelOptions={panelOptions}
        onClose={closeModal}
        onSelectPanel={selectPanelImage}
      />

      {/* Occurrences Modal Overlay */}
      {isOccurrencesRoute && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-10 z-[9999] flex items-center justify-center p-4"
          onClick={() => navigate(`/${date}/${eventId}`)}
        >
          <div 
            className="w-full max-w-2xl max-h-[80vh] overflow-visible bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <OccurrencesPage />
          </div>
        </div>
      )}
    </div>
  );
} 