import React from 'react';
import { useShiftBlocks } from '../../hooks/useShiftBlocks';
import ShiftBlock from './ShiftBlock';

interface ShiftBlocksProps {
  weekStart: string;
  selectedDay: number;
}

const ShiftBlocks: React.FC<ShiftBlocksProps> = ({ weekStart, selectedDay }) => {
  const { data: blocks, isLoading, error } = useShiftBlocks(selectedDay, weekStart);

  return (
    <div className="mt-10">
      <h4 className="text-lg font-semibold mb-2">Shift Blocks</h4>
      {isLoading && <div className="text-gray-500">Loading shift blocks…</div>}
      {error && <div className="text-red-500">Error loading shift blocks</div>}
             {!isLoading && !error && (
         <div className="flex flex-row gap-4 overflow-x-auto">
           {blocks && blocks.length === 0 && <div className="text-gray-400">No shift blocks for this day.</div>}
                       {blocks && blocks.map(block => (
              <div key={block.id} className="min-w-[300px]">
                <ShiftBlock block={block} allBlocks={blocks} />
              </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default ShiftBlocks; 