import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacultyMember, useUpdateFacultyAttributes } from '../hooks/useFaculty';
import { useEvents } from '../hooks/useEvents';
import { usePanoptoRecording, getPanoptoViewerUrl } from '../hooks/usePanopto';
import FacultyStatusBars from './FacultyStatusBars';
import { parseEventResources, getResourceIcon, getResourceDisplayName } from '../utils/eventUtils';
import { formatTime, formatDate } from '../utils/timeUtils';

export default function EventDetail() {
  const navigate = useNavigate();
  const { eventId, date } = useParams();
  
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
  
  // Debug logging
  console.log('🎬 EventDetail - event.itemName:', event?.itemName);
  console.log('🎬 EventDetail - hasVideoRecording:', hasVideoRecording);
  console.log('🎬 EventDetail - panoptoRecording:', panoptoRecording);
  console.log('🎬 EventDetail - isPanoptoLoading:', isPanoptoLoading);
  console.log('🎬 EventDetail - panoptoError:', panoptoError);
  console.log('🎬 EventDetail - panoptoUrl:', panoptoUrl);
  console.log('🎬 EventDetail - needsPanoptoAuth:', needsPanoptoAuth);

  const handleBack = () => {
    navigate(-1);
  };

  const handleManualPanoptoSearch = () => {
    console.log('🔍 Manual Panopto search triggered for:', event?.itemName);
    refetchPanopto();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Schedule
          </button>
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
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Schedule
          </button>
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
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Schedule
          </button>
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
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Schedule
        </button>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Event Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{event.itemName}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">{formatDate(event.subject_item_date)}</p>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {hasVideoRecording && !panoptoUrl && !isPanoptoLoading && !isCorsError && (
                    <button
                      onClick={handleManualPanoptoSearch}
                      className="text-orange-600 hover:text-orange-800 text-sm flex items-center gap-1 whitespace-nowrap bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg"
                      title="Debug: Search for Panopto Recording"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      Debug Search
                    </button>
                  )}
                  {isPanoptoLoading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                      Searching...
                    </div>
                  )}
                  {panoptoUrl && (
                    <a 
                      href={panoptoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1 whitespace-nowrap bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg"
                      title="View Recording"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      View Recording
                    </a>
                  )}
                  {isCorsError && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>
                        Panopto integration requires server-side implementation. 
                        <a 
                          href="https://kellogg-northwestern.hosted.panopto.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline ml-1"
                        >
                          Search manually
                        </a>
                      </span>
                    </div>
                  )}
                  {needsPanoptoAuth && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <a 
                        href="https://kellogg-northwestern.hosted.panopto.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Log into Panopto
                      </a>
                      to view recordings
                    </div>
                  )}
                  {event.eventUrl && (
                    <a 
                      href={event.eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 whitespace-nowrap bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg"
                      title="View in 25Live"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                      View in 25Live
                    </a>
                  )}
                </div>
              </div>

              {event.lectureTitle && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Lecture Title</h2>
                  <p className="text-gray-700 dark:text-gray-300">{event.lectureTitle}</p>
                </div>
              )}

              {event.eventType && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Event Type</h2>
                  <p className="text-gray-700 dark:text-gray-300">{event.eventType}</p>
                </div>
              )}
            </div>

            {/* Resources */}
            {resources.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resources.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="flex-shrink-0 text-xl">
                        {getResourceIcon(item.itemName)}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{getResourceDisplayName(item.itemName)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Instructor Information */}
          {event.instructorName && (
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Instructor</h2>
                <div className="flex flex-col items-center gap-4 mb-6">
                  {facultyMember?.imageUrl ? (
                    <a 
                      href={facultyMember?.bioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                      title={`View ${event.instructorName}'s bio`}
                    >
                      <img 
                        src={facultyMember.imageUrl} 
                        alt={event.instructorName}
                        className="h-24 w-24 rounded-full object-cover"
                        onError={(e) => {
                          console.error('Error loading faculty image:', facultyMember.imageUrl);
                          e.target.style.display = 'none';
                        }}
                      />
                    </a>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-3xl">👤</span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{event.instructorName}</h3>
                    {facultyMember?.title && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{facultyMember.title}</p>
                    )}
                    {isFacultyLoading && (
                      <p className="text-gray-500 dark:text-gray-400">Loading faculty information...</p>
                    )}
                  </div>
                </div>

                {/* Faculty Attributes */}
                {facultyMember && (facultyMember.timing || facultyMember.complexity || facultyMember.temperment) && (
                  <FacultyStatusBars 
                    facultyMember={facultyMember} 
                    isEditable={true}
                    isUpdating={updateFacultyAttributes.isPending}
                    updateError={updateFacultyAttributes.error?.message}
                    onUpdate={(updatedValues) => {
                      updateFacultyAttributes.mutate({
                        twentyfiveliveName: event.instructorName,
                        attributes: updatedValues
                      });
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
