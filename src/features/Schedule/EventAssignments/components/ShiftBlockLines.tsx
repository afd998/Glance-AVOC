import React from 'react';
import { useShiftBlocks, ShiftBlock, useAllRoomsAssigned } from '../../../SessionAssignments/hooks/useShiftBlocks';
import ShiftBlockLine from './ShiftBlockLine';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Separator } from '../../../../components/ui/separator';
import { useEventAssignments } from '../../../../contexts/EventAssignmentsContext';

interface ShiftBlockLinesProps {
  date: string;
  className?: string;
  pixelsPerMinute: number;
  contentWidth: number;
  pageZoom: number;
  scrollLeft: number;
  startHour: number;
  onSelectRange?: (range: { leftPx: number; widthPx: number } | null) => void;
}

const ShiftBlockLines: React.FC<ShiftBlockLinesProps> = ({ date, className = '', pixelsPerMinute, contentWidth, pageZoom, scrollLeft, startHour, onSelectRange }) => {
  const { data: shiftBlocks, isLoading, error } = useShiftBlocks(date);
  const { data: allRoomsAssigned } = useAllRoomsAssigned(date);
  const {
    selectedShiftBlockId,
    setSelectedShiftBlockId,
    selectedShiftBlock,
    setSelectedShiftBlock,
    selectedShiftBlockIndex,
    setSelectedShiftBlockIndex
  } = useEventAssignments();

  React.useEffect(() => {
    if (!shiftBlocks || shiftBlocks.length === 0) return;

    if (selectedShiftBlockIndex != null) {
      if (selectedShiftBlockIndex >= 0 && selectedShiftBlockIndex < shiftBlocks.length) {
        const blockAtIndex = shiftBlocks[selectedShiftBlockIndex];
        const blockId = blockAtIndex.id.toString();
        if (selectedShiftBlockId !== blockId) {
          setSelectedShiftBlockId(blockId);
        }
        if (!selectedShiftBlock || selectedShiftBlock.id !== blockAtIndex.id) {
          setSelectedShiftBlock(blockAtIndex);
        }
        return;
      }
    }

    if (selectedShiftBlockId) {
      const matchById = shiftBlocks.find(b => b.id.toString() === selectedShiftBlockId);
      if (matchById) {
        setSelectedShiftBlockIndex(shiftBlocks.indexOf(matchById));
        if (!selectedShiftBlock || selectedShiftBlock.id !== matchById.id) {
          setSelectedShiftBlock(matchById);
        }
        return;
      }
      if (selectedShiftBlock) {
        const matchByTime = shiftBlocks.find(b =>
          b.start_time === selectedShiftBlock.start_time &&
          b.end_time === selectedShiftBlock.end_time
        );
        if (matchByTime) {
          setSelectedShiftBlockId(matchByTime.id.toString());
          setSelectedShiftBlock(matchByTime);
          setSelectedShiftBlockIndex(shiftBlocks.indexOf(matchByTime));
          return;
        }
      }
    }

    const first = shiftBlocks[0];
    setSelectedShiftBlockId(first.id.toString());
    setSelectedShiftBlock(first);
    setSelectedShiftBlockIndex(0);
  }, [
    shiftBlocks,
    selectedShiftBlockId,
    selectedShiftBlock,
    selectedShiftBlockIndex,
    setSelectedShiftBlockId,
    setSelectedShiftBlock,
    setSelectedShiftBlockIndex
  ]);

  if (isLoading) {
    return (
      <div className={`py-2 ${className}`}>
        <div className="text-sm text-gray-500 dark:text-gray-300">Loading shift blocks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-red-500">Error loading shift blocks</div>
      </div>
    );
  }

  if (!shiftBlocks || shiftBlocks.length === 0) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-gray-500 dark:text-gray-300">No shift blocks found for this date</div>
      </div>
    );
  }

  const selectedExists = !!selectedShiftBlockId && shiftBlocks.some(b => b.id.toString() === selectedShiftBlockId);
  const currentValue = selectedExists
    ? selectedShiftBlockId as string
    : (selectedShiftBlockIndex != null && selectedShiftBlockIndex >= 0 && selectedShiftBlockIndex < shiftBlocks.length)
        ? shiftBlocks[selectedShiftBlockIndex].id.toString()
        : (shiftBlocks.length > 0 ? shiftBlocks[0].id.toString() : undefined);

  return (
    <Tabs 
      value={currentValue}
      onValueChange={(val) => {
        const sbIndex = shiftBlocks.findIndex(b => b.id.toString() === val);
        const sb = sbIndex >= 0 ? shiftBlocks[sbIndex] : null;
        setSelectedShiftBlockId(val);
        setSelectedShiftBlock(sb);
        setSelectedShiftBlockIndex(sbIndex >= 0 ? sbIndex : null);
        if (!onSelectRange) return;
        if (!sb || !sb.start_time || !sb.end_time) { onSelectRange(null); return; }
        const toMinutes = (t: string) => { const [h,m] = t.split(":"); return parseInt(h,10)*60 + parseInt(m,10); };
        const startMin = toMinutes(sb.start_time);
        const endMin = toMinutes(sb.end_time);
        const startOffsetMin = startMin - (startHour*60);
        const widthMin = Math.max(0, endMin - startMin);
        const leftPx = startOffsetMin * pixelsPerMinute;
        const widthPx = widthMin * pixelsPerMinute;
        onSelectRange({ leftPx, widthPx });
      }}
      className={`w-full gap-4 ${className}`}
      style={{ 
        width: `${contentWidth * pageZoom}px`,
        transform: `translateX(-${scrollLeft}px)`
      }}
    >
      <TabsList className="bg-background rounded-none border-b p-0">
        {shiftBlocks.map((shiftBlock: ShiftBlock, index: number) => (
          <React.Fragment key={shiftBlock.id}>
            <TabsTrigger 
              value={shiftBlock.id.toString()}
              className=" w-auto px-0 mx-0 bg-background data-[state=active]:border-primary dark:data-[state=active]:border-primary h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none "
             
            >
              <ShiftBlockLine 
                shiftBlock={shiftBlock}
                pixelsPerMinute={pixelsPerMinute}
                pageZoom={pageZoom}
                allRoomsAssigned={!!allRoomsAssigned}
              />
            </TabsTrigger>
            {index < shiftBlocks.length - 1 && (
              <Separator orientation="vertical" className="h-8 " />
            )}
          </React.Fragment>
        ))}
      </TabsList>

     
    </Tabs>
  );
};

export default ShiftBlockLines;
