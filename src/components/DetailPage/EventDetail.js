import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacultyMember, useUpdateFacultyAttributes } from '../../hooks/useFaculty';
import { useEvents } from '../../hooks/useEvents';
import { usePanoptoRecording, getPanoptoViewerUrl } from '../../hooks/usePanopto';
import { parseEventResources } from '../../utils/eventUtils';
import EventHeader from './EventHeader';
import SessionSetup from './SessionSetup';
import PanelModal from './PanelModal';

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId, date } = useParams();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState(null); // 'left' or 'right'
  
  // Panel image options
  const panelOptions = [
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
    return events.find(e => {
      const eventKey = `${e.itemName}-${e.start}-${e.subject_itemName}`;
      return eventKey === decodeURIComponent(eventId);
    });
  }, [events, eventId]);
  
  const { data: facultyMember, isLoading: isFacultyLoading } = useFacultyMember(event?.instructorName);
  const updateFacultyAttributes = useUpdateFacultyAttributes();
  
  // Parse event resources using the utility function (only if event exists)
  const { resources, hasVideoRecording } = event ? parseEventResources(event) : { resources: [], hasVideoRecording: false };
  
  // Search for Panopto recording only if event has video recording
  const { data: panoptoRecording, isLoading: isPanoptoLoading, error: panoptoError, refetch: refetchPanopto } = usePanoptoRecording(
    hasVideoRecording ? event?.itemName : null
  );
  const panoptoUrl = getPanoptoViewerUrl(panoptoRecording?.id);
  
  // Check if the error is due to authentication
  const needsPanoptoAuth = panoptoError && (panoptoError.status === 401 || panoptoError.status === 403);
  
  // Check if it's a CORS error
  const isCorsError = panoptoRecording?.error === 'CORS_BLOCKED';

  const handleBack = () => {
    navigate(-1);
  };

  const handleManualPanoptoSearch = () => {
    refetchPanopto();
  };

  const openPanelModal = (panel) => {
    setEditingPanel(panel);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPanel(null);
  };

  const selectPanelImage = (imageId) => {
    if (!editingPanel || !facultyMember) return;
    
    const updatedAttributes = {
      ...facultyMember,
      [editingPanel === 'left' ? 'left_source' : 'right_source']: imageId
    };
    
    updateFacultyAttributes.mutate({
      twentyfiveliveName: event.instructorName,
      attributes: updatedAttributes
    });
    
    closeModal();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading event details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-red-600 dark:text-red-400">
            <h1 className="text-2xl font-bold mb-4">Error Loading Event</h1>
            <p>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p>The event you're looking for could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto flex flex-row items-start gap-4">
        {/* Back Button - left of main content, vertically centered */}
        <button
          onClick={handleBack}
          className="flex-shrink-0 mt-2 mr-2 text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-300 rounded-full p-2 focus:outline-none font-bold"
          aria-label="Back to Schedule"
          title="Back to Schedule"
        >
          <span className="text-3xl leading-none">&lt;</span>
        </button>
        
        {/* Main Content */}
        <div className="flex-1">
          <EventHeader
            event={event}
            facultyMember={facultyMember}
            isFacultyLoading={isFacultyLoading}
            hasVideoRecording={hasVideoRecording}
            panoptoUrl={panoptoUrl}
            isPanoptoLoading={isPanoptoLoading}
            isCorsError={isCorsError}
            needsPanoptoAuth={needsPanoptoAuth}
            onManualPanoptoSearch={handleManualPanoptoSearch}
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
