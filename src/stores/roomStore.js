import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoomStore = create(
  persist(
    (set, get) => ({
      // State
      selectedRooms: [],
      allRooms: [],
      notificationRooms: [], // Separate rooms for notifications
      
      // Actions
      setAllRooms: (rooms) => set({ allRooms: rooms }),
      
      setSelectedRooms: (rooms) => {
        console.log('Zustand: Setting selected rooms to:', rooms);
        set({ selectedRooms: rooms });
      },
      
      addRoom: (room) => {
        const { selectedRooms } = get();
        if (!selectedRooms.includes(room)) {
          console.log('Zustand: Adding room:', room);
          set({ selectedRooms: [...selectedRooms, room] });
        }
      },
      
      removeRoom: (room) => {
        const { selectedRooms } = get();
        console.log('Zustand: Removing room:', room);
        set({ selectedRooms: selectedRooms.filter(r => r !== room) });
      },
      
      toggleRoom: (room) => {
        const { selectedRooms } = get();
        console.log('Zustand toggleRoom called for:', room);
        console.log('Zustand current selectedRooms:', selectedRooms);
        console.log('Zustand room is currently selected:', selectedRooms.includes(room));
        
        if (selectedRooms.includes(room)) {
          console.log('Zustand: Removing room:', room);
          get().removeRoom(room);
        } else {
          console.log('Zustand: Adding room:', room);
          get().addRoom(room);
        }
        
        console.log('Zustand: After toggle, selectedRooms:', get().selectedRooms);
      },
      
      selectAllRooms: () => {
        const { allRooms } = get();
        console.log('Zustand: Selecting all rooms:', allRooms);
        set({ selectedRooms: [...allRooms] });
      },
      
      clearAllRooms: () => {
        console.log('Zustand: Clearing all rooms');
        set({ selectedRooms: [] });
      },
      
      // Notification room actions
      setNotificationRooms: (rooms) => {
        console.log('Zustand: Setting notification rooms to:', rooms);
        set({ notificationRooms: rooms });
      },
      
      addNotificationRoom: (room) => {
        const { notificationRooms } = get();
        if (!notificationRooms.includes(room)) {
          console.log('Zustand: Adding notification room:', room);
          set({ notificationRooms: [...notificationRooms, room] });
        }
      },
      
      removeNotificationRoom: (room) => {
        const { notificationRooms } = get();
        console.log('Zustand: Removing notification room:', room);
        set({ notificationRooms: notificationRooms.filter(r => r !== room) });
      },
      
      toggleNotificationRoom: (room) => {
        const { notificationRooms } = get();
        console.log('Zustand toggleNotificationRoom called for:', room);
        
        if (notificationRooms.includes(room)) {
          console.log('Zustand: Removing notification room:', room);
          get().removeNotificationRoom(room);
        } else {
          console.log('Zustand: Adding notification room:', room);
          get().addNotificationRoom(room);
        }
      },
      
      selectAllNotificationRooms: () => {
        const { allRooms } = get();
        console.log('Zustand: Selecting all notification rooms:', allRooms);
        set({ notificationRooms: [...allRooms] });
      },
      
      clearAllNotificationRooms: () => {
        console.log('Zustand: Clearing all notification rooms');
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
        selectedRooms: state.selectedRooms,
        notificationRooms: state.notificationRooms 
      }), // only persist these fields
    }
  )
);

export default useRoomStore; 