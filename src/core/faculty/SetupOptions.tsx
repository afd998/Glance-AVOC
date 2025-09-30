import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';
import { useFacultySetup, useUpdateFacultySetupAttributes } from './hooks/useFacultySetup';

type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface SetupOptionsProps {
  event: Event;
  facultyMember: FacultyMember;
  primaryInstructorName: string;
  openPanelModal: (panel: 'left' | 'right') => void;
}

export default function SetupOptions({
  event,
  facultyMember,
  primaryInstructorName,
  openPanelModal
}: SetupOptionsProps) {
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get faculty setup data
  const { data: facultySetup, isLoading: isLoadingSetup } = useFacultySetup(facultyMember.id);
  const updateFacultySetupAttributes = useUpdateFacultySetupAttributes();
  
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  const themeHexColors = getEventThemeHexColors(event);

  // Show loading state while fetching faculty setup data
  if (isLoadingSetup) {
    return (
      <div className="backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-lg p-3 sm:p-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}BB, ${themeHexColors[2]}99)` }}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-lg p-3 sm:p-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}BB, ${themeHexColors[2]}99)` }}>
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base sm:text-lg font-medium text-black">Setup Options</h4>
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors text-sm font-medium ${
            isEditMode 
              ? 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200' 
              : 'bg-white/20 border-white/20 text-black hover:bg-white/30'
          }`}
          title={isEditMode ? "Exit edit mode" : "Enter edit mode"}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {isEditMode ? 'Exit Edit' : 'Edit'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Uses Microphone */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative m-0 p-0">
              <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-200 rounded-full"></div>
              <img 
                src="/lapel.png" 
                alt="Lapel microphone" 
                className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 object-cover m-0 p-0 scale-150 -top-3 sm:-top-4"
              />
            </div>
            <span className="text-sm sm:text-base text-black font-medium">Uses Microphone</span>
          </div>
          {isEditMode ? (
            <label className="inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="hidden peer"
                checked={facultySetup?.uses_mic || false}
                onChange={() => {
                  if (!updateFacultySetupAttributes.isPending && facultySetup) {
                    updateFacultySetupAttributes.mutate({
                      facultyId: facultyMember.id,
                      attributes: {
                        uses_mic: !facultySetup.uses_mic,
                        left_source: facultySetup.left_source ?? '',
                        right_source: facultySetup.right_source ?? ''
                      }
                    });
                  }
                }}
                disabled={updateFacultySetupAttributes.isPending || isLoadingSetup}
              />
              <span className={
                `w-6 h-6 flex items-center justify-center border-2 rounded transition-colors duration-150
                ${facultySetup?.uses_mic ? 'border-green-600 bg-green-100' : `border-gray-400 ${themeColors[3]}`}
                ${updateFacultySetupAttributes.isPending ? 'opacity-60' : ''}`
              }>
                {updateFacultySetupAttributes.isPending ? (
                  <span className="animate-spin w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"></span>
                ) : facultySetup?.uses_mic ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : null}
              </span>
            </label>
          ) : (
            <div className="flex items-center">
              <span className={`w-6 h-6 flex items-center justify-center border-2 rounded ${
                facultySetup?.uses_mic ? 'border-green-600 bg-green-100' : 'border-gray-400 bg-gray-100'
              }`}>
                {facultySetup?.uses_mic ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : null}
              </span>
            </div>
          )}
        </div>
        
        {/* Panels */}
        {(facultySetup?.right_source || facultySetup?.left_source) && (
          <div className="mt-6">
            <h4 className="text-base sm:text-lg font-medium text-black mb-3">Panel</h4>
            <div className="flex gap-3 sm:gap-4">
              {facultySetup?.left_source && (
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-black mb-2">Left Panel</p>
                  {isEditMode ? (
                    <button
                      onClick={() => openPanelModal('left')}
                      className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}AA, ${themeHexColors[2]}88)` }}
                      title="Click to change panel setup"
                    >
                      <img 
                        src={`/panel-images/${facultySetup.left_source}.png`}
                        alt={`Left panel setup for ${primaryInstructorName}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading left panel image:', facultySetup.left_source, 'Full path:', `/panel-images/${facultySetup.left_source}.png`);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultySetup.left_source}.png</span>`;
                        }}
                      />
                    </button>
                  ) : (
                    <div className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center backdrop-blur-sm shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}AA, ${themeHexColors[2]}88)` }}>
                      <img 
                        src={`/panel-images/${facultySetup.left_source}.png`}
                        alt={`Left panel setup for ${primaryInstructorName}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading left panel image:', facultySetup.left_source, 'Full path:', `/panel-images/${facultySetup.left_source}.png`);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultySetup.left_source}.png</span>`;
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-black text-center mt-2 font-medium">
                    {facultySetup.left_source.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
              {facultySetup?.right_source && (
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-black mb-2">Right Panel</p>
                  {isEditMode ? (
                    <button
                      onClick={() => openPanelModal('right')}
                      className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm shadow-lg hover:shadow-xl" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}AA, ${themeHexColors[2]}88)` }}
                      title="Click to change panel setup"
                    >
                      <img 
                        src={`/panel-images/${facultySetup.right_source}.png`}
                        alt={`Right panel setup for ${primaryInstructorName}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading right panel image:', facultySetup.right_source, 'Full path:', `/panel-images/${facultySetup.right_source}.png`);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultySetup.right_source}.png</span>`;
                        }}
                      />
                    </button>
                  ) : (
                    <div className="w-full h-24 sm:h-32 rounded-lg border border-white/10 dark:border-white/5 flex items-center justify-center backdrop-blur-sm shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}AA, ${themeHexColors[2]}88)` }}>
                      <img 
                        src={`/panel-images/${facultySetup.right_source}.png`}
                        alt={`Right panel setup for ${primaryInstructorName}`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          console.error('Error loading right panel image:', facultySetup.right_source, 'Full path:', `/panel-images/${facultySetup.right_source}.png`);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultySetup.right_source}.png</span>`;
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-black text-center mt-2 font-medium">
                    {facultySetup.right_source.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Setup Updated Timestamp */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-black/70">
            {facultySetup?.updated_at 
              ? `Last updated: ${new Date(facultySetup.updated_at).toLocaleString()}`
              : 'Never updated'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
