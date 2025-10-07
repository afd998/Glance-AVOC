import React from 'react';
import { useProfile } from '../../../core/User/useProfile';
import { useClearFilter } from '../hooks/useClearFilter';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

const NoEventsMessage: React.FC = () => {
  const { currentFilter } = useProfile();
  const { handleClearFilter } = useClearFilter();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <Empty className="pointer-events-auto max-w-md w-full mx-4">
        <EmptyHeader>
          <EmptyTitle>No Events Found</EmptyTitle>
          <EmptyDescription>
            No events match the filter <span className="font-semibold">{currentFilter || 'All Rooms'}</span> for this day.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleClearFilter}>
            Clear Filter
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};

export default NoEventsMessage;
