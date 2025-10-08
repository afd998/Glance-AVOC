import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ShiftBlock } from '../../../SessionAssignments/hooks/useShiftBlocks';
import UserAvatar from '../../../../core/User/UserAvatar';
import { Item, ItemContent, ItemTitle } from '../../../../components/ui/item';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { Badge } from '../../../../components/ui/badge';

interface ShiftBlockLineProps {
  shiftBlock: ShiftBlock;
  pixelsPerMinute: number;
  pageZoom: number;
  allRoomsAssigned?: boolean;
}

const ShiftBlockLine: React.FC<ShiftBlockLineProps> = ({ shiftBlock, pixelsPerMinute, pageZoom, allRoomsAssigned }) => {
  // Helper function to format time labels
  const formatTimeLabel = (time: string | null): string => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m), 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Calculate width based on time duration
  const calculateWidth = () => {
    if (!shiftBlock.start_time || !shiftBlock.end_time) return 0;
    
    const startTime = new Date(`2000-01-01T${shiftBlock.start_time}`);
    const endTime = new Date(`2000-01-01T${shiftBlock.end_time}`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
     return durationMinutes * pixelsPerMinute * pageZoom;
  };

  const blockWidth = calculateWidth();
  
  // Calculate duration in hours to determine if we should truncate avatars
  const calculateDurationHours = () => {
    if (!shiftBlock.start_time || !shiftBlock.end_time) return 0;
    
    const startTime = new Date(`2000-01-01T${shiftBlock.start_time}`);
    const endTime = new Date(`2000-01-01T${shiftBlock.end_time}`);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    return durationMinutes / 60;
  };

  const durationHours = calculateDurationHours();
  const shouldTruncateAvatars = durationHours < 3;
  const maxVisibleAvatars = shouldTruncateAvatars ? 2 : 10; // Show max 2 avatars if < 3 hours
  
  // Truncate time display for very narrow shift blocks
  // Calculate approximate text width needed for time display
  const timeText = `${formatTimeLabel(shiftBlock.start_time)} - ${formatTimeLabel(shiftBlock.end_time)}`;
  const estimatedTextWidth = timeText.length * 8; // Rough estimate: 8px per character
  const shouldTruncateTime = blockWidth < (estimatedTextWidth + 100); // Add buffer for avatars
  const displayTime = shouldTruncateTime ? "..." : timeText;
  
  // Debug logging
  console.log(`Shift block ${shiftBlock.id}: width=${blockWidth}px, text="${timeText}", estimatedTextWidth=${estimatedTextWidth}px, shouldTruncate=${shouldTruncateTime}`);

  const assignments = shiftBlock.assignments && Array.isArray(shiftBlock.assignments) ? shiftBlock.assignments : [];
  const visibleAssignments = assignments.slice(0, maxVisibleAvatars);
  const hiddenCount = assignments.length - maxVisibleAvatars;

  return (
    <Item 
      variant="default"
      className=" mx-0   transition-shadow duration-200 flex-row"
      style={{ width: `${Math.floor(blockWidth)}px` }}
    >
      <ItemContent className="flex flex-row  justify-center items-center w-full gap-3">
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <ItemTitle className="text-sm font-medium cursor-help">
                  {displayTime}
                </ItemTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatTimeLabel(shiftBlock.start_time)} - {formatTimeLabel(shiftBlock.end_time)}</p>
              </TooltipContent>
            </Tooltip>
            {allRoomsAssigned && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className="flex h-6 w-6 items-center justify-center rounded-full border-emerald-500/40 bg-emerald-500/15 p-0 text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-200"
                    aria-label="All rooms assigned"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>all rooms assigned</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
        
        <div className="bg-background flex items-center rounded-full border p-1 shadow-sm">
          <div className="flex -space-x-2">
            {visibleAssignments.length > 0 ? (
              visibleAssignments.map((assignment: any, index: number) => (
                <UserAvatar 
                  key={`${assignment.user}-${index}`}
                  userId={assignment.user}
                  size="sm"
                  className="h-6 w-6 ring-background ring-2"
                  variant="solid"
                />
              ))
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">—</span>
              </div>
            )}
          </div>
          {hiddenCount > 0 && (
            <span className="text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full bg-transparent px-2 text-xs shadow-none hover:bg-transparent">
              +{hiddenCount}
            </span>
          )}
        </div>
      </ItemContent>
    </Item>
  );
};

export default ShiftBlockLine;
