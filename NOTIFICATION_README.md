# Event Notification System

This notification system provides browser-based notifications for events that have staff assistance or web conferencing capabilities. Notifications are sent 15 minutes before the event starts.

## Features

- **Automatic Detection**: Only events with "KSM-KGH-AV-Staff Assistance" or "KSM-KGH-AV-Web Conference" resources trigger notifications
- **15-Minute Warning**: Notifications are sent exactly 15 minutes before event start time
- **Browser Notifications**: Uses the Web Notifications API for cross-platform compatibility
- **Smart Scheduling**: Automatically schedules notifications when events are loaded
- **Permission Management**: Handles notification permissions gracefully
- **Test Mode**: Includes a test button for development and verification

## How It Works

### 1. Permission Request
When users first visit the app, they'll see a notification settings panel. They can click "Enable" to grant notification permissions.

### 2. Event Detection
The system automatically scans all loaded events and identifies those with:
- Staff Assistance (`KSM-KGH-AV-Staff Assistance`)
- Web Conferencing (`KSM-KGH-AV-Web Conference`)

### 3. Notification Scheduling
For qualifying events, the system:
- Calculates the notification time (15 minutes before start)
- Schedules a timeout to trigger the notification
- Stores timeout IDs for cleanup

### 4. Notification Display
When triggered, notifications show:
- Event name
- Start and end times
- Resource types (Staff Assistance/Web Conference)
- Auto-close after 10 seconds
- Click to focus the app window

## Browser Compatibility

The notification system works in all modern browsers that support the Web Notifications API:
- Chrome 22+
- Firefox 22+
- Safari 7+
- Edge 14+

## User Experience

### First Time Users
1. See notification settings panel
2. Click "Enable" button
3. Browser prompts for permission
4. Grant permission to receive notifications

### Regular Users
- Notifications appear automatically 15 minutes before qualifying events
- Click notifications to focus the app
- Settings panel shows current status

### Permission States
- **Default**: User hasn't made a choice yet
- **Granted**: Notifications are enabled and working
- **Denied**: User blocked notifications (must enable in browser settings)

## Development Features

### Test Component
The `NotificationTest` component provides a "Test Notification" button that:
- Only appears when notifications are enabled
- Sends an immediate test notification
- Helps verify the system is working

### Debug Information
The system logs important events to the console:
- Permission status changes
- Notification scheduling
- Event detection results

## Technical Implementation

### Files
- `src/hooks/useNotifications.js` - Main notification logic
- `src/components/NotificationSettings.js` - UI for permission management
- `src/components/NotificationTest.js` - Testing component
- `src/App.js` - Integration with main app

### Key Functions
- `useNotifications()` - Main hook providing notification functionality
- `scheduleNotificationsForEvents()` - Schedules notifications for event arrays
- `requestPermission()` - Handles permission requests
- `sendNotification()` - Displays individual notifications

## Customization

### Timing
To change the notification timing, modify the `minutesBefore` parameter in `scheduleNotification()` calls.

### Event Filtering
To add more event types that trigger notifications, modify the condition in `scheduleNotification()`:

```javascript
if (!hasStaffAssistance && !hasWebConference && !hasOtherResource) {
  return; // Only notify for specific event types
}
```

### Notification Content
To customize notification appearance, modify the `sendNotification()` function:
- Change title format
- Modify body text
- Add custom icons
- Adjust auto-close timing

## Troubleshooting

### Notifications Not Appearing
1. Check browser permission settings
2. Verify events have the required resources
3. Ensure the app tab is active (some browsers require this)
3. Check console for error messages

### Permission Issues
1. Clear browser site data
2. Reset notification permissions in browser settings
3. Try a different browser

### Timing Issues
1. Check system clock accuracy
2. Verify event times are in correct timezone
3. Ensure the app is running when notifications should trigger

## Security Considerations

- Notifications only work over HTTPS in production
- Permission is required for each domain
- Notifications are sandboxed to the browser
- No personal data is transmitted

## Future Enhancements

Potential improvements could include:
- Custom notification sounds
- Different timing options (5 min, 30 min, etc.)
- Notification history
- Email fallback for missed notifications
- Integration with calendar apps 