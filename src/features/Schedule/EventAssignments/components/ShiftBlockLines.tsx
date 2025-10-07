import React from 'react';
import { useShiftBlocks, ShiftBlock } from '../../../SessionAssignments/hooks/useShiftBlocks';
import ShiftBlockLine from './ShiftBlockLine';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
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
  const { selectedShiftBlockId, setSelectedShiftBlockId, setSelectedShiftBlock } = useEventAssignments();

  React.useEffect(() => {
    if (!shiftBlocks || shiftBlocks.length === 0) return;
    if (selectedShiftBlockId && shiftBlocks.find(b => b.id.toString() === selectedShiftBlockId)) return;
    const first = shiftBlocks[0];
    setSelectedShiftBlockId(first.id.toString());
    setSelectedShiftBlock(first);
  }, [shiftBlocks, selectedShiftBlockId, setSelectedShiftBlockId, setSelectedShiftBlock]);

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

  const initialValue = (selectedShiftBlockId && shiftBlocks.find(b => b.id.toString() === selectedShiftBlockId))
    ? selectedShiftBlockId
    : (shiftBlocks.length > 0 ? shiftBlocks[0].id.toString() : undefined);

  return (
    <Tabs 
      defaultValue={initialValue}
      onValueChange={(val) => {
        const sb = shiftBlocks.find(b => b.id.toString() === val) || null;
        setSelectedShiftBlockId(val);
        setSelectedShiftBlock(sb);
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
