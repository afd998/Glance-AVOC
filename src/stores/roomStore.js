import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoomStore = create(
  persist(
    (set, get) => ({
      // State
      selectedRooms: [], // Will be populated when allRooms is set
      allRooms: [], // Will be populated from database
      notificationRooms: [], // Will be populated when allRooms is set
      
      // Actions
      setAllRooms: (rooms) => {
        const { selectedRooms } = get();
        // Filter out rooms with & since they don't get their own rows
        let filteredRooms = rooms.filter(room => !room.includes('&'));
        
        // Add missing constituent rooms that might be needed for merged events
        // This ensures rooms like GH 1430, GH 2410B, etc. exist even if not in database
        const additionalRooms = [];
        const roomSet = new Set(filteredRooms);
        
        // Check for missing counterpart rooms
        filteredRooms.forEach(room => {
          // For 1420 -> ensure 1430 exists
          if (room === 'GH 1420' && !roomSet.has('GH 1430')) {
            additionalRooms.push('GH 1430');
          }
          // For A rooms -> ensure B counterpart exists
          if (room.match(/GH \d+A$/) && !roomSet.has(room.replace('A', 'B'))) {
            additionalRooms.push(room.replace('A', 'B'));
          }
          // For B rooms -> ensure A counterpart exists  
          if (room.match(/GH \d+B$/) && !roomSet.has(room.replace('B', 'A'))) {
            additionalRooms.push(room.replace('B', 'A'));
          }
        });
        
        // Add the additional rooms and preserve priority order
        const allRoomsWithAdditional = [...filteredRooms, ...additionalRooms];
        
        // Priority rooms that should appear at the top (same as useRooms.ts)
        const priorityRooms = ['GH L070', 'GH L110', 'GH L120', 'GH L130', 'GH 1130'];
        
        // Sort rooms with priority rooms first, then alphabetically
        filteredRooms = allRoomsWithAdditional.sort((a, b) => {
          const aIndex = priorityRooms.indexOf(a);
          const bIndex = priorityRooms.indexOf(b);
          
          // If both are priority rooms, sort by priority order
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          
          // If only 'a' is priority, it comes first
          if (aIndex !== -1) return -1;
          
          // If only 'b' is priority, it comes first
          if (bIndex !== -1) return 1;
          
          // Neither is priority, sort alphabetically
          return a.localeCompare(b);
        });
        
        // If selectedRooms is empty (first time), initialize with filtered rooms
        const newSelectedRooms = selectedRooms.length === 0 ? filteredRooms : selectedRooms.filter(room => !room.includes('&'));
        set({ 
          allRooms: filteredRooms,
          selectedRooms: newSelectedRooms,
          notificationRooms: filteredRooms 
        });
      },
      
      setSelectedRooms: (rooms) => {
        set({ selectedRooms: rooms });
      },
      
      addRoom: (room) => {
        const { selectedRooms } = get();
        if (!selectedRooms.includes(room)) {
          set({ selectedRooms: [...selectedRooms, room] });
        }
      },
      
      removeRoom: (room) => {
        const { selectedRooms } = get();
        set({ selectedRooms: selectedRooms.filter(r => r !== room) });
      },
      
      toggleRoom: (room) => {
        const { selectedRooms } = get();
        if (selectedRooms.includes(room)) {
          get().removeRoom(room);
        } else {
          get().addRoom(room);
        }
      },
      
      selectAllRooms: () => {
        const { allRooms } = get();
        set({ selectedRooms: [...allRooms] });
      },
      
      clearAllRooms: () => {
        set({ selectedRooms: [] });
      },
      
      // Notification room actions
      setNotificationRooms: (rooms) => {
        set({ notificationRooms: rooms });
      },
      
      addNotificationRoom: (room) => {
        const { notificationRooms } = get();
        if (!notificationRooms.includes(room)) {
          set({ notificationRooms: [...notificationRooms, room] });
        }
      },
      
      removeNotificationRoom: (room) => {
        const { notificationRooms } = get();
        set({ notificationRooms: notificationRooms.filter(r => r !== room) });
      },
      
      toggleNotificationRoom: (room) => {
        const { notificationRooms } = get();
        if (notificationRooms.includes(room)) {
          get().removeNotificationRoom(room);
        } else {
          get().addNotificationRoom(room);
        }
      },
      
      selectAllNotificationRooms: () => {
        const { allRooms } = get();
        set({ notificationRooms: [...allRooms] });
      },
      
      clearAllNotificationRooms: () => {
        set({ notificationRooms: [] });
      },
      
      // Computed
      getSelectedRoomsCount: () => get().selectedRooms.length,
      getTotalRoomsCount: () => get().allRooms.length,
      getNotificationRoomsCount: () => get().notificationRooms.length,
    }),
    {
      name: 'room-store', // unique name for localStorage key
      partialize: (state) => ({ 
        // Don't persist room selections - they should come from current filter or auto-hide logic
      }), // don't persist any fields
    }
  )
);

export default useRoomStore; 
