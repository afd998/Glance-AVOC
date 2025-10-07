import React, { useRef } from 'react';
import { useShiftBlocks } from '../../SessionAssignments/hooks/useShiftBlocks';
import ShiftBlock from './components/ShiftBlock';

interface ShiftBlocksProps {
  date: string;
}

const ShiftBlocks: React.FC<ShiftBlocksProps> = ({ date }) => {
  const { data: blocks, isLoading, error } = useShiftBlocks(date);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle header drag to scroll the container
  const handleHeaderDrag = (deltaX: number, deltaY: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= deltaX;
      scrollContainerRef.current.scrollTop -= deltaY;
    }
  };

  const content = (
    <div className="mt-10 select-none max-w-full">
      <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white select-none">Shift Blocks</h4>
      {isLoading && <div className="text-gray-500 dark:text-gray-400 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm select-none">Loading shift blocks…</div>}
      {error && <div className="text-red-500 dark:text-red-400 p-4 rounded-lg bg-red-100/50 dark:bg-red-900/20 backdrop-blur-sm border border-red-300/50 dark:border-red-700/50 select-none">Error loading shift blocks</div>}
      {!isLoading && !error && (
        <div ref={scrollContainerRef} className="flex flex-row gap-4 overflow-x-auto pb-4 max-w-full">
          {blocks && blocks.length === 0 && <div className="text-gray-400 dark:text-gray-500 p-4 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700/30 select-none">No shift blocks for this day.</div>}
          {blocks && blocks.map(block => (
            <div key={block.id} className="w-[300px] shrink-0">
              <ShiftBlock 
                block={block} 
                allBlocks={blocks}
                onHeaderDrag={handleHeaderDrag}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return content;
};

export default ShiftBlocks; 