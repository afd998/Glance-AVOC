-- Reset all panopto check statuses back to null
-- This will clear the incorrectly marked missed checks so the corrected function can run properly

-- Reset all statuses to null
UPDATE panopto_checks 
SET 
    status = NULL,
    updated_at = NOW()
WHERE status IS NOT NULL;

-- Verify the reset
SELECT 
    COUNT(*) as total_checks,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed
FROM panopto_checks;

-- Show a few examples to confirm
SELECT 
    id,
    event_id,
    check_time,
    status,
    completed_time,
    updated_at
FROM panopto_checks 
LIMIT 10;
