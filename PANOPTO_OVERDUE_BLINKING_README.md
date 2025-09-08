# Panopto Overdue Blinking Feature

## Overview
This feature adds a blinking red background to Event components when they have overdue Panopto checks, providing immediate visual feedback to users about events that need attention.

## Implementation Details

### 1. Hook: `useOverduePanoptoChecks`
- **Location**: `src/hooks/useOverduePanoptoChecks.ts`
- **Purpose**: Detects which events have overdue Panopto checks
- **Logic**:
  - Checks events with recording resources (Panopto/recording)
  - Only considers currently active events (between start and end time)
  - Queries the `panopto_checks` table for completion status
  - Marks events as overdue if:
    - Database status is 'missed', OR
    - No completion recorded and past due time (scheduled + 5 minutes)
- **Update Frequency**: Every 30 seconds

### 2. CSS Animation
- **Location**: `src/index.css`
- **Animation**: `panopto-overdue-blink`
- **Effect**: Alternates between red-500 and red-700 colors
- **Duration**: 1 second cycle, infinite loop
- **Class**: `.panopto-overdue-blink`

### 3. Event Component Updates
- **Location**: `src/components/Event/Event.tsx`
- **New Prop**: `hasOverduePanoptoChecks?: boolean`
- **Behavior**: 
  - When `true`, applies `panopto-overdue-blink` class instead of theme colors
  - Affects main event background and continuation lines
  - Maintains all other styling and functionality

### 4. Component Integration
- **HomePage**: Uses `useOverduePanoptoChecks` hook and passes `hasOverdueChecks` function to RoomRow
- **RoomRow**: Accepts `hasOverdueChecks` function and passes boolean result to each Event
- **SchedulerGrid**: Updated to include the new prop (set to false for demo events)

## Usage
The feature works automatically - no user interaction required. Events with overdue Panopto checks will automatically start blinking red in the main grid view.

## Technical Notes
- The blinking effect only applies to events that are:
  1. Currently active (between start and end time)
  2. Have recording resources (Panopto/recording)
  3. Have overdue checks (missed or past due time)
- The system checks for overdue status every 30 seconds
- The animation is smooth and non-intrusive
- All existing functionality remains unchanged

## Future Enhancements
- Could add sound alerts for overdue checks
- Could add different colors for different urgency levels
- Could add user preferences to disable the blinking effect
