import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationTest() {
  const { permission, sendNotification } = useNotifications();

  const testNotification = () => {
    if (permission !== 'granted') {
      alert('Please enable notifications first!');
      return;
    }

    // Create a simple test event for immediate notification
    const testEvent = {
      id: 'test-123',
      itemName: 'Test Event with Staff Assistance',
      start: 14.5, // 2:30 PM (just for display purposes)
      end: 15.5,   // 3:30 PM
      subject_item_date: new Date().toISOString().split('T')[0],
      itemDetails: {
        occur: {
          prof: [{
            rsv: [{
              res: [
                { itemName: "KSM-KGH-AV-Staff Assistance" },
                { itemName: "KSM-KGH-AV-Web Conference" }
              ]
            }]
          }]
        }
      }
    };

    
    // Send notification immediately (bypass scheduling)
    sendNotification(testEvent, true, true);
  };

  if (permission !== 'granted') {
    return null; // Don't show test button if notifications aren't enabled
  }

  return (
    <button
      onClick={testNotification}
      className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      Test Notification
    </button>
  );
} 
