import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacultyMember, useUpdateFacultyAttributes } from '../../hooks/useFaculty';
import { useEvents } from '../../hooks/useEvents';
import { parseEventResources } from '../../utils/eventUtils';
import EventDetailHeader from './EventDetailHeader';
import SessionSetup from './SessionSetup';
import PanelModal from './PanelModal';
import { Database } from '../../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface PanelOption {
  id: string;
  label: string;
  image: string;
}

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId, date } = useParams<{ eventId: string; date: string }>();
  
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
  const selectedDate = React.useMemo(() => {
    if (!date) return new Date();
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day, 12, 0, 0);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [date]);
  
  // Get all events for the specific date
  const { events, isLoading, error } = useEvents(selectedDate);
  
  // Find the specific event by ID
  const event = React.useMemo(() => {
    if (!events || !eventId) return null;
    return events.find(e => e.id === parseInt(eventId, 10));
  }, [events, eventId]);
  
  const { data: facultyMember, isLoading: isFacultyLoading } = useFacultyMember(event?.instructor_name || '');
  const updateFacultyAttributes = useUpdateFacultyAttributes();
  
  // Parse event resources using the utility function (only if event exists)
  const { resources, hasVideoRecording } = event ? parseEventResources(event) : { resources: [], hasVideoRecording: false };

  const handleBack = () => {
    navigate(-1);
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
    if (!editingPanel || !facultyMember || !event) return;
    
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
      twentyfiveliveName: event.instructor_name || '',
      attributes: updatedAttributes
    });
    
    closeModal();
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
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

  if (!event) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p>The event you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Close Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Main Content */}
            <div className="flex-1 w-full">
              <EventDetailHeader
                event={event}
                facultyMember={facultyMember}
                isFacultyLoading={isFacultyLoading}
                hasVideoRecording={hasVideoRecording}
                resources={resources}
              />
              
              <SessionSetup
                event={event}
                resources={resources}
                facultyMember={facultyMember}
                isFacultyLoading={isFacultyLoading}
                updateFacultyAttributes={updateFacultyAttributes}
                openPanelModal={openPanelModal}
              />
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
    </div>
  );
} 