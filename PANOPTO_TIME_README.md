# Panopto Time Feature

The Panopto Time feature automatically monitors your assigned events with recording resources and prompts you to check Panopto at regular intervals during those events.

## How It Works

### 1. **Event Detection**
- Automatically scans your assigned events
- Identifies events with recording resources
- Only monitors events assigned to you

### 2. **Check Scheduling**
- Every 30 minutes during an event, a "Panopto Check" is triggered
- Checks are numbered sequentially (Check #1, Check #2, etc.)
- Checks are sent immediately when due

### 3. **Notification System**
- **Push Notifications**: Immediate browser notifications when checks are due
- **Dropdown Integration**: Active checks appear in the notifications dropdown
- **Offline Support**: Service worker handles checks even when app is closed

### 4. **Check Management**
- **Complete Button**: Mark checks as completed in the dropdown
- **Auto-Cleanup**: Checks older than 30 minutes are automatically removed
- **Real-time Updates**: Check status syncs across browser tabs

## Features

### Service Worker
- **Background Processing**: Runs independently of the main app
- **Offline Support**: Works when browser is closed or offline
- **Push Notifications**: Immediate notifications for new checks
- **IndexedDB Storage**: Local storage for check persistence

### Notification Integration
- **Dropdown Display**: Active checks appear in notification bell dropdown
- **Visual Distinction**: Orange styling for Panopto checks vs regular notifications
- **Complete Actions**: One-click completion of checks
- **Count Integration**: Panopto checks count toward notification badge

### Real-time Updates
- **Live Updates**: New checks appear immediately
- **Cross-tab Sync**: Changes sync across browser tabs
- **Background Sync**: Service worker handles timing independently

## Technical Implementation

### Service Worker (`/public/sw.js`)
- Handles background check scheduling
- Manages IndexedDB storage
- Sends push notifications
- Communicates with main app

### Hook (`usePanoptoChecks`)
- Manages Panopto check state
- Communicates with service worker
- Handles check completion
- Integrates with notification system

### Notification Integration
- Enhanced `NotificationBell` component
- Special handling for Panopto check notifications
- Visual distinction from regular notifications
- Complete button functionality

## Usage

### For Users
1. **Automatic Setup**: Feature activates automatically when you have events with recordings
2. **Check Notifications**: Receive notifications every 30 minutes during recording events
3. **Complete Checks**: Click "Complete" in the notification dropdown
4. **Monitor Status**: See active checks in the notification bell

### For Developers
1. **Test Component**: Use the PanoptoTest component in development
2. **Service Worker**: Check browser dev tools for service worker logs
3. **IndexedDB**: Use browser dev tools to inspect stored checks
4. **Push Notifications**: Test with browser notification permissions

## Configuration

### Check Interval
- Default: 30 minutes
- Configurable in service worker (`PANOPTO_CHECK_INTERVAL`)

### Check Expiry
- Default: 30 minutes
- Configurable in service worker (`PANOPTO_CHECK_EXPIRY`)

### Recording Resource Detection
- Looks for resources containing "recording" in the name
- Case-insensitive matching
- Parses event resources from Supabase

## Browser Support

### Required Features
- Service Workers
- Push Notifications
- IndexedDB
- Web Notifications API

### Supported Browsers
- Chrome 42+
- Firefox 44+
- Safari 11.1+
- Edge 17+

## Development

### Testing
- Use the PanoptoTest component in development mode
- Test button creates mock Panopto checks
- Debug panel shows all check data

### Debugging
- Check browser console for service worker logs
- Use browser dev tools to inspect IndexedDB
- Monitor push notification permissions

### Deployment
- Service worker is automatically registered
- No additional setup required
- Works with existing notification system 