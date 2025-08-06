import React, { useState } from 'react';
import { usePanoptoChecks } from '../hooks/usePanoptoChecks';
import { useTheme } from '../contexts/ThemeContext';

export const PanoptoTest: React.FC = () => {
  const {
    panoptoChecks,
    activeChecks,
    completedChecks,
    isLoading,
    error,
    completePanoptoCheck,
    clearPanoptoChecks,
    registerPanoptoEvents
  } = usePanoptoChecks();

  const { isDarkMode } = useTheme();
  const [testEvent, setTestEvent] = useState({
    eventId: 999,
    eventName: 'Test Event',
    startTime: '09:00:00',
    endTime: '10:30:00',
    date: new Date().toISOString().split('T')[0],
    roomName: 'Test Room',
    instructorName: 'Test Instructor'
  });

  const handleTestPanoptoCheck = () => {
    // Send a test message to the service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TEST_PANOPTO_CHECK',
        event: testEvent,
        checkNumber: 1
      });
    }
  };

  const handleRegisterEvents = () => {
    registerPanoptoEvents();
  };

  const handleClearChecks = () => {
    clearPanoptoChecks();
  };

  const handleTestEventChange = (field: string, value: string) => {
    setTestEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={`p-6 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        Panopto Test Component
      </h2>

      {/* Test Event Configuration */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Test Event Configuration
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Event Name
            </label>
            <input
              type="text"
              value={testEvent.eventName}
              onChange={(e) => handleTestEventChange('eventName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Room Name
            </label>
            <input
              type="text"
              value={testEvent.roomName}
              onChange={(e) => handleTestEventChange('roomName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Start Time
            </label>
            <input
              type="time"
              value={testEvent.startTime}
              onChange={(e) => handleTestEventChange('startTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              End Time
            </label>
            <input
              type="time"
              value={testEvent.endTime}
              onChange={(e) => handleTestEventChange('endTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Actions
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleTestPanoptoCheck}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors`}
          >
            Test Panopto Check
          </button>
          <button
            onClick={handleRegisterEvents}
            className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors`}
          >
            Register Events
          </button>
          <button
            onClick={handleClearChecks}
            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors`}
          >
            Clear All Checks
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          Status
        </h3>
        <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Error:</strong> {error || 'None'}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Total Checks:</strong> {panoptoChecks.length}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Active Checks:</strong> {activeChecks.length}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <strong>Completed Checks:</strong> {completedChecks.length}
          </p>
        </div>
      </div>

      {/* Active Checks */}
      {activeChecks.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Active Checks ({activeChecks.length})
          </h3>
          <div className="space-y-2">
            {activeChecks.map((check) => (
              <div
                key={check.id}
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-orange-900/20 border-orange-500/30 text-orange-200'
                    : 'bg-orange-50 border-orange-200 text-orange-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {check.eventName} - Check #{check.checkNumber}
                    </p>
                    <p className="text-sm opacity-75">{check.roomName}</p>
                    <p className="text-xs opacity-75">
                      Created: {check.createdAt ? new Date(check.createdAt).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() => completePanoptoCheck(check.id)}
                    className={`ml-2 px-3 py-1 text-xs rounded transition-colors ${
                      isDarkMode
                        ? 'bg-orange-600 hover:bg-orange-500 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Checks */}
      {completedChecks.length > 0 && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Completed Checks ({completedChecks.length})
          </h3>
          <div className="space-y-2">
            {completedChecks.map((check) => (
              <div
                key={check.id}
                className={`p-3 rounded-lg border ${
                  isDarkMode
                    ? 'bg-green-900/20 border-green-500/30 text-green-200'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {check.eventName} - Check #{check.checkNumber}
                  </p>
                  <p className="text-sm opacity-75">{check.roomName}</p>
                  <p className="text-xs opacity-75">
                    Completed: {check.completed ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Checks Message */}
      {panoptoChecks.length === 0 && (
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No Panopto checks found</p>
        </div>
      )}
    </div>
  );
}; 