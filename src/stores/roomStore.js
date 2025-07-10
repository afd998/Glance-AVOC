import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the rooms array in the store
const rooms = [
  "GH L129", "GH L110", "GH L120", "GH L130", "GH L070", "GH 1110", "GH 1120", "GH 1130",
  "GH 1420", "GH 1430", "GH 2110", "GH 2120", "GH 2130",
  "GH 2410A", "GH 2410B", "GH 2420A", "GH 2420B", "GH 2430A", "GH 2430B",
  "GH 4101", "GH 4301", "GH 4302", "GH 5101", "GH 5201", "GH 5301"
];

const useRoomStore = create(
  persist(
    (set, get) => ({
      // State - initialize with rooms array
      selectedRooms: rooms, // Start with all rooms selected
      allRooms: rooms, // Initialize with rooms array
      notificationRooms: rooms, // Start with all rooms for notifications
      
      // Actions
      setAllRooms: (rooms) => set({ allRooms: rooms }),
      
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
        selectedRooms: state.selectedRooms,
        notificationRooms: state.notificationRooms 
      }), // only persist these fields
    }
  )
);

export default useRoomStore; 
