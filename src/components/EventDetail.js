import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFacultyMember, useUpdateFacultyAttributes } from '../hooks/useFaculty';
import { useEvents } from '../hooks/useEvents';
import FacultyStatusBars from './FacultyStatusBars';

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

  const formatTime = (floatHours) => {
    const hours = Math.floor(floatHours);
    const minutes = Math.round((floatHours - hours) * 60);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleBack = () => {
    navigate(-1);
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

  // Find the matching reservation for the current date
  const matchingReservation = event.itemDetails?.occur?.prof?.[0]?.rsv?.[0];

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
            {matchingReservation?.res?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Resources</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchingReservation.res.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="flex-shrink-0 text-xl">
                        {item.itemName === "KSM-KGH-VIDEO-Recording (POST TO CANVAS)" && "📹"}
                        {item.itemName === "KSM-KGH-VIDEO-Recording (PRIVATE LINK)" && "🔗"}
                        {item.itemName === "KSM-KGH-VIDEO-Recording" && "📹"}
                        {item.itemName === "KSM-KGH-AV-Handheld Microphone" && "🎤"}
                        {item.itemName === "KSM-KGH-AV-Staff Assistance" && "🚶"}
                        {item.itemName === "KSM-KGH-AV-Web Conference" && (
                          <img 
                            src="/zoomicon.png" 
                            alt="Web Conference" 
                            className="w-6 h-6 object-contain dark:invert"
                          />
                        )}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{item.itemName}</span>
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
