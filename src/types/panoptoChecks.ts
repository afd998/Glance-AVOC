// Types for the new panopto_checks table structure
// This replaces the JSONB boolean array approach

export interface PanoptoCheck {
  id: number;
  event_id: number;
  check_time: string; // TIME type (HH:MM:SS format)
  completed_time: string | null; // TIME type when completed
  completed_by_user_id: string | null; // UUID of user who completed it
  created_at: string;
  updated_at: string;
}

export interface PanoptoCheckWithEvent extends PanoptoCheck {
  event_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room_name: string | null;
  instructor_names: string[] | null;
  status: 'upcoming' | 'current' | 'overdue' | 'completed';
}

// Status calculation helper
export type CheckStatus = 'upcoming' | 'current' | 'overdue' | 'completed';

// Input types for creating checks
export interface CreatePanoptoCheckInput {
  event_id: number;
  check_time: string;
}

export interface CompletePanoptoCheckInput {
  event_id: number;
  check_time: string;
  completed_by_user_id: string;
}

// Query result types
export interface EventCheckSummary {
  event_id: number;
  event_name: string;
  total_checks: number;
  completed_checks: number;
  pending_checks: number;
  completion_percentage: number;
}

export interface UserCheckStats {
  user_id: string;
  email: string;
  total_completed: number;
  events_worked_on: number;
}

// Database view type (from panopto_checks_with_events view)
export interface PanoptoCheckView extends PanoptoCheck {
  event_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room_name: string | null;
  instructor_names: string[] | null;
  status: CheckStatus;
}

// Hook return types for the refactored system
export interface UsePanoptoChecksReturn {
  checks: PanoptoCheckWithEvent[];
  isLoading: boolean;
  error: string | null;
  completeCheck: (eventId: number, checkTime: string) => Promise<boolean>;
  initializeChecksForEvent: (eventId: number) => Promise<boolean>;
  getChecksForEvent: (eventId: number) => Promise<PanoptoCheckWithEvent[]>;
  getEventSummary: (eventId: number) => Promise<EventCheckSummary | null>;
  refreshChecks: () => Promise<void>;
}
