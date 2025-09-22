-- Index for events table to optimize date-based queries
-- This will significantly improve performance for queries filtering by date
CREATE INDEX IF NOT EXISTS idx_events_date ON events (date);

-- Optional: Composite index if you also frequently order by start_time
-- This would be even more efficient for the specific query pattern
CREATE INDEX IF NOT EXISTS idx_events_date_start_time ON events (date, start_time);
