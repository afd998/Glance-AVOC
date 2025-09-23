import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { getAVResourceIcon, getResourceDisplayName, getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';
// import FacultyStatusBars from './FacultyStatusBars';
import SetupNotesEditor from './SetupNotesEditor';
import SetupOptions from './SetupOptions';
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
  facultyMembers: FacultyMember[];
  instructorNames: string[];
  isFacultyLoading: boolean;
  updateFacultyAttributes: any; // Type this properly when the hook is converted
  openPanelModal: (panel: 'left' | 'right') => void;
}

export default function SessionSetup({
  event,
  resources,
  facultyMembers,
  instructorNames,
  isFacultyLoading,
  updateFacultyAttributes,
  openPanelModal
}: SessionSetupProps) {
  // Use the provided instructor data (now handles individual instructors properly)
  const facultyMember = facultyMembers && facultyMembers.length > 0 ? facultyMembers[0] : null;
  const primaryInstructorName = instructorNames && instructorNames.length > 0 ? instructorNames[0] : '';
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  const themeHexColors = getEventThemeHexColors(event);

  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);

  // State for collapsible functionality
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-3 sm:p-6 mb-8" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}CC, ${themeHexColors[2]}AA)` }}>
      {/* Collapsible Header */}
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2 className="text-lg sm:text-xl font-semibold text-black">
          Faculty Profile{facultyMember?.kelloggdirectory_name ? ` - ${facultyMember.kelloggdirectory_name.split(' ').pop()}` : primaryInstructorName ? ` - ${primaryInstructorName.split(' ').pop()}` : ''}
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

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Faculty Information - Full Width at Top */}
          {instructorNames.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <div className="backdrop-blur-sm border border-white/10 dark:border-white/5 rounded-lg p-3 sm:p-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}BB, ${themeHexColors[2]}99)` }}>
            <div className="flex items-center gap-2 sm:gap-3">
              {facultyMember?.kelloggdirectory_image_url ? (
                <div
                  onMouseEnter={() => setIsFacultyHovering(true)}
                  onMouseLeave={() => setIsFacultyHovering(false)}
                >
                  <FacultyAvatar
                    imageUrl={facultyMember.kelloggdirectory_image_url}
                    cutoutImageUrl={facultyMember.cutout_image}
                    instructorName={primaryInstructorName}
                    isHovering={isFacultyHovering}
                    size="lg"
                    priority={true} // Mark as priority since it's above the fold
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
                    {facultyMember?.kelloggdirectory_name ? `Dr. ${facultyMember.kelloggdirectory_name}` : primaryInstructorName}
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
          {instructorNames.length > 0 && facultyMember && (
            <SetupOptions
              event={event}
              facultyMember={facultyMember}
              primaryInstructorName={primaryInstructorName}
              updateFacultyAttributes={updateFacultyAttributes}
              openPanelModal={openPanelModal}
            />
          )}

          {/* Attributes */}
          {/* {instructorNames.length > 0 && facultyMember && (facultyMember.timing || facultyMember.complexity || facultyMember.temperment) && (
            <div>
              <FacultyStatusBars 
                facultyMember={facultyMember} 
                isEditable={true}
                isUpdating={updateFacultyAttributes.isPending}
                updateError={updateFacultyAttributes.error?.message}
                event={event}
                onUpdate={(updatedValues: any) => {
                  updateFacultyAttributes.mutate({
                    twentyfiveliveName: primaryInstructorName,
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
          )} */}
          </div>

        {/* Right Column - Setup Notes */}
        <div className="">
          {instructorNames.length > 0 && facultyMember && (
            <div>
              <SetupNotesEditor
                event={event}
                facultyMember={facultyMember}
              />
            </div>
          )}
        </div>
      </div>

        </>
      )}
    </div>
  );
}