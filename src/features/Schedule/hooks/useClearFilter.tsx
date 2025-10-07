import { useFilters } from './useFilters';

export const useClearFilter = () => {
  const { loadFilter, getFilterByName } = useFilters();

  // Handler to clear the current filter (load "All Rooms" filter)
  const handleClearFilter = async () => {
    try {
      // Check if there's already an "All Rooms" filter
      const allRoomsFilter = getFilterByName('All Rooms');
      
      if (allRoomsFilter) {
        await loadFilter(allRoomsFilter);
      } else {
        // TODO: Handle case where "All Rooms" filter doesn't exist
        // This could involve creating a default filter or loading all rooms
      }
    } catch (error) {
      console.error('Error handling clear filter:', error);
      // TODO: Add proper error handling/notification
    }
  };

  return {
    handleClearFilter,
  };
};
