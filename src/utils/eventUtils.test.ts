import { isUserEventOwner } from './eventUtils';

describe('isUserEventOwner', () => {
  const testUserId = 'test-user-123';
  
  describe('Manual ownership', () => {
    it('should return true when user is the manual owner', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: testUserId
      };
      
      const result = isUserEventOwner(event, testUserId);
      expect(result).toBe(true);
    });
    
    it('should return false when user is not the manual owner', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: 'other-user-456'
      };
      
      const result = isUserEventOwner(event, testUserId);
      expect(result).toBe(false);
    });
  });
  
  describe('KEC events', () => {
    it('should return false for KEC events even if user is manual owner', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'KEC',
        man_owner: testUserId
      };
      
      const result = isUserEventOwner(event, testUserId);
      expect(result).toBe(false);
    });
  });
  
  describe('Calculated ownership from shift blocks', () => {
    it('should return true when user is assigned to the event room in shift blocks', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const shiftBlocks = [
        {
          id: 1,
          date: '2024-01-15',
          start_time: '08:00:00',
          end_time: '12:00:00',
          assignments: [
            {
              user: testUserId,
              rooms: ['Test Room', 'Other Room']
            }
          ]
        }
      ];
      
      const result = isUserEventOwner(event, testUserId, shiftBlocks);
      expect(result).toBe(true);
    });
    
    it('should return false when user is not assigned to the event room', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const shiftBlocks = [
        {
          id: 1,
          date: '2024-01-15',
          start_time: '08:00:00',
          end_time: '12:00:00',
          assignments: [
            {
              user: testUserId,
              rooms: ['Other Room', 'Another Room']
            }
          ]
        }
      ];
      
      const result = isUserEventOwner(event, testUserId, shiftBlocks);
      expect(result).toBe(false);
    });
    
    it('should return false when shift blocks are for different date', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const shiftBlocks = [
        {
          id: 1,
          date: '2024-01-16', // Different date
          start_time: '08:00:00',
          end_time: '12:00:00',
          assignments: [
            {
              user: testUserId,
              rooms: ['Test Room']
            }
          ]
        }
      ];
      
      const result = isUserEventOwner(event, testUserId, shiftBlocks);
      expect(result).toBe(false);
    });
    
    it('should return false when shift blocks do not overlap with event time', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const shiftBlocks = [
        {
          id: 1,
          date: '2024-01-15',
          start_time: '11:00:00', // After event ends
          end_time: '12:00:00',
          assignments: [
            {
              user: testUserId,
              rooms: ['Test Room']
            }
          ]
        }
      ];
      
      const result = isUserEventOwner(event, testUserId, shiftBlocks);
      expect(result).toBe(false);
    });
  });
  
  describe('Edge cases', () => {
    it('should return false when event has missing required fields', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        // Missing start_time, end_time, room_name
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const result = isUserEventOwner(event, testUserId);
      expect(result).toBe(false);
    });
    
    it('should return false when shift blocks have no assignments', () => {
      const event = {
        id: 1,
        date: '2024-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        room_name: 'Test Room',
        event_type: 'LECTURE',
        man_owner: null
      };
      
      const shiftBlocks = [
        {
          id: 1,
          date: '2024-01-15',
          start_time: '08:00:00',
          end_time: '12:00:00',
          assignments: [] // No assignments
        }
      ];
      
      const result = isUserEventOwner(event, testUserId, shiftBlocks);
      expect(result).toBe(false);
    });
  });
}); 