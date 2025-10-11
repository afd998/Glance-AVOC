import React, { useState } from 'react';
import { Database } from '../../types/supabase';
import { getEventThemeColors, getEventThemeHexColors } from '../../utils/eventUtils';
// import FacultyStatusBars from './FacultyStatusBars';
import { FacultyAvatar } from './FacultyAvatar';
import BYODDevicesCard from './BYODDevicesCard';
import SessionSetups from './SessionSetups';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink } from 'lucide-react';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';


type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface ResourceItem {
  itemName: string;
  quantity?: number;
  [key: string]: any;
}

interface SessionSetupProps {
  event: Event;

  facultyMembers: FacultyMember[];
  instructorNames: string[];
  isFacultyLoading: boolean;
}

export default function SessionSetup({
  event,

  facultyMembers,
  instructorNames,
  isFacultyLoading
}: SessionSetupProps) {
  // Use the provided instructor data (now handles individual instructors properly)
  const facultyMember = facultyMembers && facultyMembers.length > 0 ? facultyMembers[0] : null;
  const primaryInstructorName = instructorNames && instructorNames.length > 0 ? instructorNames[0] : '';
  // Get theme colors based on event type
  const themeColors = getEventThemeColors(event);
  const themeHexColors = getEventThemeHexColors(event);

  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);


  // BYOD handled in BYODDevicesCard
  
  return (
    <div className="bg-background text-foreground rounded-xl shadow-2xl border border-white/20 dark:border-white/10 p-3 sm:p-6 mb-12">
      {/* Two Column Layout - BYOD Devices and Setups */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Left Column - BYOD Devices */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Faculty Information - Top of Left Column */}
          {instructorNames.length > 0 && (
           
              <Item
                variant="outline"
                className=""
              
              >
                <ItemMedia>
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
                        priority={true}
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl">👤</span>
                    </div>
                  )}
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span className="text-base sm:text-lg font-medium  truncate">
                      {(() => {
                        const fullName = facultyMember?.kelloggdirectory_name || primaryInstructorName;
                        const nameParts = fullName.split(' ');
                        if (nameParts.length >= 2) {
                          const firstName = nameParts[0];
                          const lastName = nameParts.slice(1).join(' ');
                          return `Dr. ${firstName} - ${lastName}`;
                        }
                        return `Dr. ${fullName}`;
                      })()}
                    </span>
                  </ItemTitle>
                  {facultyMember?.kelloggdirectory_title && (
                    <ItemDescription className="truncate ">{facultyMember.kelloggdirectory_title}</ItemDescription>
                  )}
                  {isFacultyLoading && (
                    <ItemDescription className="">Loading faculty info...</ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  {facultyMember?.kelloggdirectory_bio_url && (
                    <a
                      href={facultyMember.kelloggdirectory_bio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors shrink-0"
                      title="View faculty directory page"
                      aria-label="Open faculty profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </ItemActions>
              </Item>
       
          )}
          {/* {instructorNames.length > 0 && facultyMember && (
            <BYODDevicesCard facultyId={facultyMember.id} themeHexColors={themeHexColors as any} />
          )} */}
        </div>

        {/* Right Column - Setups */}
        <div className="lg:col-span-3 space-y-4 sm:space-y-6">
          {instructorNames.length > 0 && facultyMember && (
            <SessionSetups
              event={event}
              facultyMember={facultyMember}
              primaryInstructorName={primaryInstructorName}
            />
          )}
        </div>
      </div>
    </div>
  );
}

