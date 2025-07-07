import React from 'react';
import { getResourceIcon, getResourceDisplayName } from '../../utils/eventUtils';
import SetupNotesEditor from '../SetupNotesEditor';
import FacultyStatusBars from '../FacultyStatusBars';

export default function SessionSetup({ 
  event, 
  resources, 
  facultyMember, 
  isFacultyLoading,
  updateFacultyAttributes,
  openPanelModal
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Session Setup</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resources Box */}
        {resources.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resources</h3>
            <div className="space-y-3">
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

        {/* Typical Setup Box */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Typical Setup: {event.instructorName}
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg min-h-[200px]">
            {event.instructorName && facultyMember ? (
              <div className="space-y-4">
                {/* Uses Microphone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img 
                      src="/lapel.png" 
                      alt="Lapel microphone" 
                      className="w-16 h-16 object-contain"
                    />
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Uses Microphone</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="hidden peer"
                      checked={facultyMember.uses_mic || false}
                      onChange={() => {
                        if (!updateFacultyAttributes.isPending) {
                          updateFacultyAttributes.mutate({
                            twentyfiveliveName: event.instructorName,
                            attributes: {
                              ...facultyMember,
                              uses_mic: !facultyMember.uses_mic
                            }
                          });
                        }
                      }}
                      disabled={updateFacultyAttributes.isPending}
                    />
                    <span className={
                      `w-6 h-6 flex items-center justify-center border-2 rounded transition-colors duration-150
                      ${facultyMember.uses_mic ? 'border-green-600 bg-green-100' : 'border-gray-400 bg-white dark:bg-gray-800'}
                      ${updateFacultyAttributes.isPending ? 'opacity-60' : ''}`
                    }>
                      {updateFacultyAttributes.isPending ? (
                        <span className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></span>
                      ) : facultyMember.uses_mic ? (
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : null}
                    </span>
                  </label>
                </div>
                
                {/* Setup Notes */}
                <SetupNotesEditor
                  value={facultyMember.setup_notes || ''}
                  onSave={newNotes => {
                    updateFacultyAttributes.mutate({
                      twentyfiveliveName: event.instructorName,
                      attributes: {
                        ...facultyMember,
                        setup_notes: newNotes
                      }
                    });
                  }}
                  isSaving={updateFacultyAttributes.isPending}
                  error={updateFacultyAttributes.error?.message}
                />
                
                {/* Panel Images */}
                {(() => {
                  console.log('Panel sources debug:', {
                    left_source: facultyMember.left_source,
                    right_source: facultyMember.right_source,
                    hasLeft: !!facultyMember.left_source,
                    hasRight: !!facultyMember.right_source
                  });
                  return null;
                })()}
                
                {(facultyMember.right_source || facultyMember.left_source) && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Panel</h4>
                    <div className="flex gap-4">
                      {facultyMember.left_source && (
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Left Panel</p>
                          <button
                            onClick={() => openPanelModal('left')}
                            className="w-full h-32 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                            title="Click to change panel setup"
                          >
                            <img 
                              src={`/panel-images/${facultyMember.left_source}.png`}
                              alt={`Left panel setup for ${event.instructorName}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                console.error('Error loading left panel image:', facultyMember.left_source, 'Full path:', `/panel-images/${facultyMember.left_source}.png`);
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-gray-500">Failed to load: ${facultyMember.left_source}.png</span>`;
                              }}
                              onLoad={(e) => {
                                console.log('Successfully loaded left panel image:', facultyMember.left_source);
                              }}
                            />
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">
                            {facultyMember.left_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                      {facultyMember.right_source && (
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Right Panel</p>
                          <button
                            onClick={() => openPanelModal('right')}
                            className="w-full h-32 bg-purple-100 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-700 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors cursor-pointer"
                            title="Click to change panel setup"
                          >
                            <img 
                              src={`/panel-images/${facultyMember.right_source}.png`}
                              alt={`Right panel setup for ${event.instructorName}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                console.error('Error loading right panel image:', facultyMember.right_source, 'Full path:', `/panel-images/${facultyMember.right_source}.png`);
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = `<span class="text-gray-500">Failed to load: ${facultyMember.right_source}.png</span>`;
                              }}
                              onLoad={(e) => {
                                console.log('Successfully loaded right panel image:', facultyMember.right_source);
                              }}
                            />
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">
                            {facultyMember.right_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {isFacultyLoading ? 'Loading faculty information...' : 'No faculty information available'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Faculty Attributes - Full Width Below */}
      {event.instructorName && facultyMember && (facultyMember.timing || facultyMember.complexity || facultyMember.temperment) && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Instructor Preferences</h3>
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
        </div>
      )}
    </div>
  );
} 