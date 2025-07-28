import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';

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
      event_name: 'Test Event with Staff Assistance',
      start_time: new Date().toISOString(), // Current time as ISO string
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      subject_item_date: new Date().toISOString().split('T')[0],
      resources: JSON.stringify([
        { itemName: "KSM-KGH-AV-Staff Assistance" },
        { itemName: "KSM-KGH-AV-Web Conference" }
      ])
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