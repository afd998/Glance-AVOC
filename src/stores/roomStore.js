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
        const filteredRooms = rooms.filter(room => !room.includes('&'));
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
