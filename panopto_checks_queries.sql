-- Common queries for the new panopto_checks table
-- These replace the JSONB array operations

-- 1. Get all panopto checks for a specific event
SELECT
    pc.*,
    e.event_name,
    e.date,
    e.start_time,
    e.end_time
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.event_id = :event_id
ORDER BY pc.check_time;

-- 2. Get completed checks for an event
SELECT COUNT(*) as completed_checks
FROM panopto_checks
WHERE event_id = :event_id
AND completed_time IS NOT NULL;

-- 3. Get pending checks for an event
SELECT COUNT(*) as pending_checks
FROM panopto_checks
WHERE event_id = :event_id
AND completed_time IS NULL;

-- 4. Check if all checks are completed for an event
SELECT
    event_id,
    COUNT(*) as total_checks,
    COUNT(completed_time) as completed_checks,
    COUNT(*) = COUNT(completed_time) as all_completed
FROM panopto_checks
WHERE event_id = :event_id
GROUP BY event_id;

-- 5. Get checks that are currently due (within last 30 minutes and not completed)
SELECT pc.*, e.event_name, e.room_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.completed_time IS NULL
AND pc.check_time >= (CURRENT_TIME - INTERVAL '30 minutes')
AND pc.check_time <= CURRENT_TIME
AND e.date = CURRENT_DATE;

-- 6. Get overdue checks
SELECT pc.*, e.event_name, e.room_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.completed_time IS NULL
AND pc.check_time < CURRENT_TIME
AND e.date = CURRENT_DATE;

-- 7. Complete a specific check
UPDATE panopto_checks
SET
    completed_time = CURRENT_TIME,
    completed_by_user_id = auth.uid(),
    updated_at = NOW()
WHERE event_id = :event_id
AND check_time = :check_time
AND completed_time IS NULL;  -- Prevent double completion

-- 8. Initialize checks for a new event (create check records)
-- This replaces the JSONB array initialization
INSERT INTO panopto_checks (event_id, check_time)
SELECT
    :event_id,
    (start_time::time + INTERVAL '30 minutes' * generate_series(0,
        LEAST(EXTRACT(EPOCH FROM (end_time::time - start_time::time))/1800 - 1, 1000)::integer
    ))::time as check_time
FROM events
WHERE id = :event_id
AND start_time IS NOT NULL
AND end_time IS NOT NULL;

-- 9. Get user's completed checks for today
SELECT
    pc.*,
    e.event_name,
    e.room_name,
    e.instructor_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.completed_by_user_id = auth.uid()
AND pc.completed_time IS NOT NULL
AND e.date = CURRENT_DATE
ORDER BY pc.completed_time DESC;

-- 10. Get events with their check completion status
SELECT
    e.id,
    e.event_name,
    e.start_time,
    e.end_time,
    COUNT(pc.id) as total_checks,
    COUNT(pc.completed_time) as completed_checks,
    ROUND(
        CASE
            WHEN COUNT(pc.id) > 0 THEN (COUNT(pc.completed_time)::numeric / COUNT(pc.id)::numeric) * 100
            ELSE 0
        END, 1
    ) as completion_percentage
FROM events e
LEFT JOIN panopto_checks pc ON e.id = pc.event_id
WHERE e.date = CURRENT_DATE
AND e.start_time IS NOT NULL
AND e.end_time IS NOT NULL
GROUP BY e.id, e.event_name, e.start_time, e.end_time
HAVING COUNT(pc.id) > 0  -- Only events that have panopto checks
ORDER BY e.start_time;

-- 11. Delete all checks for an event (cleanup)
DELETE FROM panopto_checks WHERE event_id = :event_id;

-- 12. Get upcoming checks for notifications
SELECT pc.*, e.event_name, e.room_name, e.instructor_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.completed_time IS NULL
AND pc.check_time BETWEEN CURRENT_TIME AND (CURRENT_TIME + INTERVAL '30 minutes')
AND e.date = CURRENT_DATE
ORDER BY pc.check_time;

-- 13. Analytics: Completion rate by user
SELECT
    u.email,
    COUNT(pc.id) as total_completed,
    COUNT(DISTINCT pc.event_id) as events_worked_on
FROM panopto_checks pc
JOIN auth.users u ON pc.completed_by_user_id = u.id
WHERE pc.completed_time IS NOT NULL
AND pc.completed_time >= CURRENT_DATE  -- Today's completions
GROUP BY u.id, u.email
ORDER BY total_completed DESC;
