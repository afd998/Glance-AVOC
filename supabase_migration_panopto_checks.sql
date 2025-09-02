-- Create panopto_checks table to replace JSONB array in events table
CREATE TABLE panopto_checks (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    check_time TIME NOT NULL,
    completed_time TIME NULL,
    completed_by_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_panopto_checks_event_id ON panopto_checks(event_id);
CREATE INDEX idx_panopto_checks_check_time ON panopto_checks(check_time);
CREATE INDEX idx_panopto_checks_completed_by_user_id ON panopto_checks(completed_by_user_id);
CREATE INDEX idx_panopto_checks_event_time ON panopto_checks(event_id, check_time);

-- Add RLS (Row Level Security) policies
ALTER TABLE panopto_checks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view panopto checks for events they have access to
CREATE POLICY "Users can view panopto checks" ON panopto_checks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = panopto_checks.event_id
            AND (e.man_owner = auth.uid()::text OR auth.role() = 'admin')
        )
    );

-- Policy: Users can insert panopto checks for events they own
CREATE POLICY "Users can insert panopto checks" ON panopto_checks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = panopto_checks.event_id
            AND (e.man_owner = auth.uid()::text OR auth.role() = 'admin')
        )
    );

-- Policy: Users can update panopto checks they created or for events they own
CREATE POLICY "Users can update panopto checks" ON panopto_checks
    FOR UPDATE USING (
        completed_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = panopto_checks.event_id
            AND (e.man_owner = auth.uid()::text OR auth.role() = 'admin')
        )
    );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_panopto_checks_updated_at
    BEFORE UPDATE ON panopto_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier querying of panopto checks with event details
CREATE VIEW panopto_checks_with_events AS
SELECT
    pc.*,
    e.event_name,
    e.date,
    e.start_time,
    e.end_time,
    e.room_name,
    e.instructor_name,
    CASE
        WHEN pc.completed_time IS NOT NULL THEN 'completed'
        WHEN pc.check_time < CURRENT_TIME AND pc.check_time >= (CURRENT_TIME - INTERVAL '30 minutes') THEN 'current'
        WHEN pc.check_time < CURRENT_TIME THEN 'overdue'
        ELSE 'upcoming'
    END as status
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id;

-- Grant necessary permissions
GRANT ALL ON panopto_checks TO authenticated;
GRANT ALL ON panopto_checks TO anon;
GRANT ALL ON panopto_checks_with_events TO authenticated;
GRANT ALL ON panopto_checks_with_events TO anon;
