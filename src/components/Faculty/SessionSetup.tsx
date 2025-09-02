import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { getResourceIcon, getResourceDisplayName, getEventThemeColors } from '../../utils/eventUtils';
import FacultyStatusBars from './FacultyStatusBars';
import SetupNotesEditor from './SetupNotesEditor';
import { FacultyAvatar } from '../FacultyAvatar';


type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface ResourceItem {
  itemName: string;
  quantity?: number;
  [key: string]: any;
}

interface SessionSetupProps {
  event: Event;
  resources: ResourceItem[];
  facultyMember: FacultyMember | null | undefined;
  isFacultyLoading: boolean;
  updateFacultyAttributes: any; // Type this properly when the hook is converted
  openPanelModal: (panel: 'left' | 'right') => void;
}

export default function SessionSetup({ 
  event, 
  resources, 
  facultyMember, 
  isFacultyLoading,
  updateFacultyAttributes,
  openPanelModal
}: SessionSetupProps) {
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  
  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);
  
  return (
    <div className={`${themeColors.mainBg} rounded-lg shadow-lg p-3 sm:p-6 mb-8`}>
      

      {/* Faculty Information - Full Width at Top */}
      {event.instructor_name && (
        <div className="mb-4 sm:mb-6">
          <div className={`border rounded-lg p-3 sm:p-4 ${themeColors.itemBg}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {facultyMember?.kelloggdirectory_image_url ? (
                <div
                  onMouseEnter={() => setIsFacultyHovering(true)}
                  onMouseLeave={() => setIsFacultyHovering(false)}
                >
                  <FacultyAvatar
                    imageUrl={facultyMember.kelloggdirectory_image_url}
                    cutoutImageUrl={facultyMember.cutout_image}
                    instructorName={event.instructor_name || ''}
                    isHovering={isFacultyHovering}
                    size="lg"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl">👤</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-medium text-black truncate">
                    {facultyMember?.kelloggdirectory_name ? `Dr. ${facultyMember.kelloggdirectory_name}` : event.instructor_name || ''}
                  </h3>
                  {facultyMember?.kelloggdirectory_bio_url && (
                    <a 
                      href={facultyMember.kelloggdirectory_bio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors flex-shrink-0"
                      title="View faculty directory page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    )}
                  </div>
                {facultyMember?.kelloggdirectory_title && (
                  <p className="text-xs sm:text-sm text-black truncate">{facultyMember.kelloggdirectory_title}</p>
                )}
                {isFacultyLoading && (
                  <p className="text-xs text-black">Loading faculty info...</p>
                )}
              </div>
            </div>
              </div>
            </div>
          )}

      {/* Two Column Layout - Attributes and Setup Options */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column - Setup Options then Attributes */}
        <div className="space-y-4 sm:space-y-6">
          {/* Setup Options Group */}
          {event.instructor_name && facultyMember && (
            <div className={`p-3 sm:p-4 rounded-lg ${themeColors.itemBg}`}>
              <div className="space-y-4">
                {/* Uses Microphone */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative m-0 p-0">
                      <div className="absolute top-0 left-0 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-gray-300 rounded-full"></div>
                    <img 
                      src="/lapel.png" 
                      alt="Lapel microphone" 
                        className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 object-cover m-0 p-0 scale-150 -top-3 sm:-top-4"
                    />
                    </div>
                    <span className="text-sm sm:text-base text-black font-medium">Uses Microphone</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="hidden peer"
                      checked={facultyMember.uses_mic || false}
                      onChange={() => {
                        if (!updateFacultyAttributes.isPending) {
                          updateFacultyAttributes.mutate({
                            twentyfiveliveName: event.instructor_name,
                            attributes: {
                              timing: facultyMember.timing ?? 0,
                              complexity: facultyMember.complexity ?? 0,
                              temperment: facultyMember.temperment ?? 0,
                              uses_mic: !facultyMember.uses_mic,
                              left_source: facultyMember.left_source ?? '',
                              right_source: facultyMember.right_source ?? ''
                            }
                          });
                        }
                      }}
                      disabled={updateFacultyAttributes.isPending}
                    />
                    <span className={
                      `w-6 h-6 flex items-center justify-center border-2 rounded transition-colors duration-150
                      ${facultyMember.uses_mic ? 'border-green-600 bg-green-100' : `border-gray-400 ${themeColors.cardBg}`}
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
                
                {(facultyMember.right_source || facultyMember.left_source) && (
                  <div className="mt-6">
                    <h4 className="text-base sm:text-lg font-medium text-black mb-3">Panel</h4>
                    <div className="flex gap-3 sm:gap-4">
                      {facultyMember.left_source && (
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-black mb-2">Left Panel</p>
                          <button
                            onClick={() => openPanelModal('left')}
                            className={`w-full h-24 sm:h-32 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${themeColors.itemBg} hover:${themeColors.mainBgDark}`}
                            title="Click to change panel setup"
                          >
                            <img 
                              src={`/panel-images/${facultyMember.left_source}.png`}
                              alt={`Left panel setup for ${event.instructor_name}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                console.error('Error loading left panel image:', facultyMember.left_source, 'Full path:', `/panel-images/${facultyMember.left_source}.png`);
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultyMember.left_source}.png</span>`;
                              }}
                              onLoad={(e) => {
                                
                              }}
                            />
                          </button>
                          <p className="text-xs text-black text-center mt-2 font-medium">
                            {facultyMember.left_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                      {facultyMember.right_source && (
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-black mb-2">Right Panel</p>
                          <button
                            onClick={() => openPanelModal('right')}
                            className={`w-full h-24 sm:h-32 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${themeColors.itemBg} hover:${themeColors.mainBgDark}`}
                            title="Click to change panel setup"
                          >
                            <img 
                              src={`/panel-images/${facultyMember.right_source}.png`}
                              alt={`Right panel setup for ${event.instructor_name}`}
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                console.error('Error loading right panel image:', facultyMember.right_source, 'Full path:', `/panel-images/${facultyMember.right_source}.png`);
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-black">Failed to load: ${facultyMember.right_source}.png</span>`;
                              }}
                              onLoad={(e) => {
                                
                              }}
                            />
                          </button>
                          <p className="text-xs text-black text-center mt-2 font-medium">
                            {facultyMember.right_source.replace(/_/g, ' ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

          {/* Attributes */}
          {event.instructor_name && facultyMember && (facultyMember.timing || facultyMember.complexity || facultyMember.temperment) && (
            <div>
              <FacultyStatusBars 
                facultyMember={facultyMember} 
                isEditable={true}
                isUpdating={updateFacultyAttributes.isPending}
                updateError={updateFacultyAttributes.error?.message}
                onUpdate={(updatedValues: any) => {
                  updateFacultyAttributes.mutate({
                    twentyfiveliveName: event.instructor_name,
                    attributes: {
                      timing: updatedValues.timing,
                      complexity: updatedValues.complexity,
                      temperment: updatedValues.temperment,
                      uses_mic: facultyMember.uses_mic ?? false,
                      left_source: facultyMember.left_source ?? '',
                      right_source: facultyMember.right_source ?? ''
                    }
                  });
                }}
              />
            </div>
          )}
          </div>

        {/* Right Column - Setup Notes */}
        <div className="">
          {event.instructor_name && facultyMember && (
            <div>
              <SetupNotesEditor
                event={event}
                facultyMember={facultyMember}
              />
            </div>
          )}
        </div>
      </div>


    </div>
  );
}