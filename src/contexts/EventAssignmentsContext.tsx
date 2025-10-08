import React, { createContext, useContext, ReactNode } from 'react';

interface ShiftBlockLike {
  id: number | string;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  assignments?: unknown;
}

interface EventAssignmentsContextType {
  showEventAssignments: boolean;
  setShowEventAssignments: (show: boolean) => void;
  selectedShiftBlockId: string | null;
  setSelectedShiftBlockId: (id: string | null) => void;
  selectedShiftBlock: ShiftBlockLike | null;
  setSelectedShiftBlock: (block: ShiftBlockLike | null) => void;
  selectedShiftBlockIndex: number | null;
  setSelectedShiftBlockIndex: (index: number | null) => void;
}

const EventAssignmentsContext = createContext<EventAssignmentsContextType | undefined>(undefined);

export const useEventAssignments = () => {
  const context = useContext(EventAssignmentsContext);
  if (context === undefined) {
    throw new Error('useEventAssignments must be used within an EventAssignmentsProvider');
  }
  return context;
};

interface EventAssignmentsProviderProps {
  children: ReactNode;
}

export const EventAssignmentsProvider: React.FC<EventAssignmentsProviderProps> = ({ children }) => {
  const [showEventAssignments, setShowEventAssignments] = React.useState(false);
  const [selectedShiftBlockId, setSelectedShiftBlockId] = React.useState<string | null>(null);
  const [selectedShiftBlock, setSelectedShiftBlock] = React.useState<ShiftBlockLike | null>(null);
  const [selectedShiftBlockIndex, setSelectedShiftBlockIndex] = React.useState<number | null>(null);

  return (
    <EventAssignmentsContext.Provider value={{ 
      showEventAssignments, 
      setShowEventAssignments,
      selectedShiftBlockId,
      setSelectedShiftBlockId,
      selectedShiftBlock,
      setSelectedShiftBlock,
      selectedShiftBlockIndex,
      setSelectedShiftBlockIndex
    }}>
      {children}
    </EventAssignmentsContext.Provider>
  );
};
