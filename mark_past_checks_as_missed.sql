-- Mark all panopto checks from before today as missed
-- This handles historical checks that should be marked as missed

UPDATE panopto_checks 
SET 
    status = 'missed',
    updated_at = NOW()
WHERE event_id IN (
    SELECT e.id 
    FROM events e 
    WHERE e.date < CURRENT_DATE
)
AND status IS NULL
AND completed_time IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_checks,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed
FROM panopto_checks;

-- Show some examples of what was marked
SELECT 
    pc.id,
    pc.event_id,
    pc.check_time,
    pc.status,
    e.date as event_date,
    e.event_name
FROM panopto_checks pc
JOIN events e ON pc.event_id = e.id
WHERE pc.status = 'missed'
AND e.date < CURRENT_DATE
LIMIT 10;
