import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatTime, formatDate } from '../../utils/timeUtils';
import { getDepartmentName } from '../../utils/departmentCodes';
import {truncateEventName } from '../../utils/eventUtils';
import { Database } from '../../types/supabase';

import { useUserProfile } from '../../core/User/useUserProfile';
import OwnerDisplay from './OwnerDisplay';
import { FacultyAvatar } from '../../core/faculty/FacultyAvatar';
import { ChevronUp, ChevronDown, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { ItemGroup, Item, ItemMedia, ItemContent, ItemActions, ItemTitle, ItemDescription } from '../../components/ui/item';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { OccurrencesDialogContent } from './OccurrencesModal';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';


type Event = Database['public']['Tables']['events']['Row'];
type FacultyMember = Database['public']['Tables']['faculty']['Row'];

interface ResourceItem {
  itemName: string;
  quantity?: number;
  [key: string]: any;
}

interface EventDetailHeaderProps {
  event: Event;
  facultyMembers: FacultyMember[];
  instructorNames: string[];
  isFacultyLoading: boolean;
  resources: ResourceItem[];
  handOffTime: string | null | undefined;
  isHandOffTimeLoading: boolean;
}

// Helper function to format ISO timestamp to time string
const formatTimeFromISO = (timeString: string | null): string => {
  if (!timeString) return '';
  try {
    // Parse HH:MM:SS format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting time:', timeString, error);
    return '';
  }
};

// Helper function to extract last names from instructor names
const extractLastNames = (instructorNames: string[]): string => {
  return instructorNames.map(name => {
    // Split by space and get the last part (assuming it's the last name)
    const nameParts = name.trim().split(' ');
    return nameParts[nameParts.length - 1];
  }).join(', ');
};



export default function EventDetailHeader({
  event,
  facultyMembers,
  instructorNames,
  isFacultyLoading,
  resources,
  handOffTime,
  isHandOffTimeLoading
}: EventDetailHeaderProps) {

  
  // State for faculty photo hover effects
  const [isFacultyHovering, setIsFacultyHovering] = useState(false);

  const handleOccurrencesClick = () => {
    setOccurrencesOpen(true);
  };
  const [occurrencesOpen, setOccurrencesOpen] = useState(false);
  // Extract hex color from theme colors for gradient
 


  // Reusable section renderer for resources
  const ResourceSection: React.FC<{ title: string; items: ResourceItem[]; keyPrefix: string }> = ({ title, items, keyPrefix }) => (
    <>
      <div className="flex items-center justify-between px-1 pb-1">
        <div className="text-xs font-medium">{title}</div>
        <Badge variant="default" className="text-[10px] px-2 py-0.5">
          {items.length}
        </Badge>
      </div>
      <ItemGroup>
        {items.map((item, index) => (
          <Item key={`${keyPrefix}-${index}`} size="sm" className="flex-nowrap">
            <ItemMedia>
              {item.icon}
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>{item.displayName}</ItemTitle>
              {item.instruction && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ItemDescription className="truncate line-clamp-1" title={item.instruction}>
                      {item.instruction}
                    </ItemDescription>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" className="max-w-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {item.itemName}
                      </Badge>
                    </div>
                    <div className="whitespace-pre-wrap">
                      {item.instruction}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </ItemContent>
            {item.quantity && item.quantity > 1 && (
              <ItemActions>
                <Badge variant="default" className="text-[10px] px-2 py-0.5">
                  x{item.quantity}
                </Badge>
              </ItemActions>
            )}
          </Item>
        ))}
      </ItemGroup>
    </>
  );

  return (
    <div className="  bg-background rounded-xl  p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between"  >
    
        {/* Left Side - Event Info */}
        <div className="flex-1 lg:w-1/2 space-y-4 ">
          {/* Background container for the first 3 elements with faculty photo */}
          <Card  className=" " >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
              {/* Left side - Faculty photos */}
              {instructorNames.length > 0 && (
                <div className="shrink-0 relative">
                  <div className="flex flex-col items-center mb-4">
                    <div
                      onMouseEnter={() => setIsFacultyHovering(true)}
                      onMouseLeave={() => setIsFacultyHovering(false)}
                      className="backdrop-blur-sm bg-linear-to-br from-purple-900/20 to-blue-900/20 p-2 rounded-lg flex items-center justify-center z-20 relative border border-purple-300/20 shadow-lg"
                    >
                      {instructorNames.length === 1 ? (
                        (() => {
                          const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorNames[0]);
                          return facultyMember?.kelloggdirectory_image_url ? (
                            <FacultyAvatar
                              imageUrl={facultyMember.kelloggdirectory_image_url}
                              cutoutImageUrl={facultyMember.cutout_image}
                              instructorName={instructorNames[0]}
                              isHovering={isFacultyHovering}
                              size="lg"
                              className="h-20 w-20"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-lg">
                              {instructorNames[0].charAt(0).toUpperCase()}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="flex -space-x-2">
                          {instructorNames.slice(0, 3).map((instructorName, index) => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorName);
                            return facultyMember?.kelloggdirectory_image_url ? (
                              <img
                                key={`${instructorName}-${index}`}
                                src={facultyMember.kelloggdirectory_image_url}
                                alt={instructorName}
                                className="h-12 w-12 rounded-full border-2 border-white object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <div
                                key={`${instructorName}-${index}`}
                                className="h-12 w-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-white font-medium"
                                title={instructorName}
                              >
                                {instructorName.charAt(0).toUpperCase()}
                              </div>
                            );
                          })}
                          {instructorNames.length > 3 && (
                            <div className="h-12 w-12 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white font-medium text-sm">
                              +{instructorNames.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-[-8px] left-[30%] transform -translate-x-1/2 text-[20px] leading-tight font-medium opacity-90 text-center whitespace-normal w-28 transition-all duration-200 uppercase flex flex-col items-center z-30" style={{
                      fontFamily: "'Olympus Mount', sans-serif",
                      color: "transparent",
                      background: "linear-gradient(-45deg, black 50%, white 50%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text"
                    }}>
                      {instructorNames.length === 1
                        ? (() => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === instructorNames[0]);
                            const fullName = facultyMember?.kelloggdirectory_name || instructorNames[0];
                            const nameParts = fullName.split(' ');
                            const isLongName = fullName.length > 18; // Adjust threshold as needed
                            const fontSize = isLongName ? 'text-[16px]' : 'text-[20px]';
                            return nameParts.length >= 2 ? (
                              <>
                                <div className={`-ml-2 whitespace-nowrap ${fontSize}`}>{nameParts[0]}</div>
                                <div className={`ml-2 whitespace-nowrap ${fontSize}`}>{nameParts.slice(1).join(' ')}</div>
                              </>
                            ) : (
                              <div className={`whitespace-nowrap ${fontSize}`}>{fullName}</div>
                            );
                          })()
                        : instructorNames.map(name => {
                            const facultyMember = facultyMembers.find(fm => fm.twentyfivelive_name === name);
                            return facultyMember?.kelloggdirectory_name || name;
                          }).map(name => {
                            // Extract last name from "FirstName LastName" format for multiple instructors
                            const parts = name.split(' ');
                            return parts.length > 1 ? parts[parts.length - 1] : name;
                          }).join(', ')
                      }
                    </div>
                  </div>
                </div>
              )}
              
              {/* Right side - Event info */}
              <div className="flex-1">
                {/* Course Code - Beginning part in bold */}
                {event.event_name && (
                  <h1 className="text-2xl sm:text-4xl font-bold  mb-0.5 uppercase" style={{ fontFamily: "'Olympus Mount', sans-serif" }}>
                    {truncateEventName(event)}
                  </h1>
                )}
                
                {/* Lecture Title */}
                {event.lecture_title && (
                  <h2 className="text-lg sm:text-2xl font-medium  mb-2 ml-4 break-words" style={{ fontFamily: "'GoudyBookletter1911', serif" }}>
                    {event.lecture_title}
                  </h2>
                )}
                
                {/* Session Code */}
                <p className="text-xs sm:text-sm  mb-0" >
                  {event.event_name}
                </p>
              </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Room and Occurrences Row */}
          <div className="flex items-start gap-3 mb-3 sm:mb-4">
            {/* Room as shadcn Item */}
            <Item variant="outline">
              <ItemMedia variant="icon">
                <MapPin className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Room</ItemTitle>
                <ItemDescription >
                  {(event.room_name || 'Unknown').replace(/^GH\s+/i, '')}
                </ItemDescription>
              </ItemContent>
            </Item>

            {/* Occurrences as shadcn Item with Dialog */}
            <Item variant="outline" className="cursor-pointer" onClick={handleOccurrencesClick}>
              <ItemMedia variant="icon">
                <div className="flex flex-col items-center justify-center">
                  <ChevronUp className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4" />
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Occurrences</ItemTitle>
                <ItemDescription>
                  {formatDate(event.date || '')} · {formatTimeFromISO(event.start_time)} - {formatTimeFromISO(event.end_time)} <span className="text-xs text-gray-500">CST</span>
                </ItemDescription>
              </ItemContent>
            </Item>
            <Dialog open={occurrencesOpen} onOpenChange={setOccurrencesOpen}>
              <DialogContent className="max-w-3xl">
                <OccurrencesDialogContent currentEvent={event as any} />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Owner Display - Show for any event */}
          <OwnerDisplay
            event={event}
            isHandOffTimeLoading={isHandOffTimeLoading}
          />
        </div>

        {/* Right Side - Event Type/Room and Instructor Info */}
       
        <div className="flex-1 lg:w-1/2 lg:pl-8">
          {/* Event Details Card as shadcn Card with ItemGroup */}
      
          <Card className="mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ItemGroup>
                <Item size="sm">
                  <ItemContent>
                    <ItemTitle>Event</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Badge >
                      {event.event_type === "Lecture" && event.event_name && event.event_name.length >= 4 ?
                        getDepartmentName(event.event_name.substring(0, 4)) :
                        (event.event_name || 'Unknown')}
                    </Badge>
                  </ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent>
                    <ItemTitle>Type</ItemTitle>
                  </ItemContent>
                  <ItemActions>
                    <Badge >
                      {event.event_type || 'Unknown'}
                    </Badge>
                  </ItemActions>
                </Item>
              </ItemGroup>
            </CardContent>
          </Card>
       

          {/* Resources Card */}
          {resources.length > 0 && (
            <Card className="mb-3">
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Resources</CardTitle>
                  <Badge variant="default" className="text-xs px-2 py-0.5">
                    {resources.length} total
                  </Badge>
                </div>
              </CardHeader>
              {(() => {
                const avResources = resources.filter(item => item.isAVResource);
                const otherResources = resources.filter(item => !item.isAVResource);
                
                return (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      <div>
                        {(avResources.length > 0 || otherResources.length === 0) && (
                          <ResourceSection title="AV Resources" items={avResources} keyPrefix="av" />
                        )}
                      </div>
                      <div>
                        {otherResources.length > 0 && (
                          <ResourceSection title="General Resources" items={otherResources} keyPrefix="other" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                );
              })()}
            </Card>
          )}
        </div>

      </div>

  );
} 
