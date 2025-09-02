-- Function to mark panopto checks as missed when they're 30+ minutes past due
-- This will be called by the Supabase Cron job every minute

CREATE OR REPLACE FUNCTION mark_missed_panopto_checks()
RETURNS INTEGER AS $$
DECLARE
    missed_count INTEGER := 0;
    check_record RECORD;
    check_datetime TIMESTAMP;
    current_datetime TIMESTAMP;
BEGIN
    -- Get current datetime for today in CST timezone
    current_datetime := NOW() AT TIME ZONE 'America/Chicago';
    
    -- Find checks that are 30+ minutes past due and not already completed or missed
    FOR check_record IN
        SELECT 
            pc.id,
            pc.event_id,
            pc.check_time,
            e.date as event_date
        FROM panopto_checks pc
        JOIN events e ON pc.event_id = e.id
        WHERE pc.status IS NULL  -- Only process checks without status
        AND pc.completed_time IS NULL  -- Not completed
        AND e.date = CURRENT_DATE  -- Only today's events
    LOOP
        -- Create the full datetime for this check
        check_datetime := check_record.event_date + check_record.check_time;
        
        -- Debug logging to see what's happening
        RAISE NOTICE 'Checking check %: scheduled: % %, current: % %, check_datetime: %, current_datetime: %, cst_now: %', 
            check_record.id, 
            check_record.event_date,
            check_record.check_time, 
            CURRENT_DATE,
            CURRENT_TIME,
            check_datetime,
            current_datetime,
            NOW() AT TIME ZONE 'America/Chicago';
        
        -- Only mark as missed if the check time has passed by 30+ minutes
        -- AND the check time is in the past (not future)
        IF check_datetime < (current_datetime - INTERVAL '30 minutes') AND check_datetime < current_datetime THEN
            -- Mark this check as missed
            UPDATE panopto_checks 
            SET 
                status = 'missed',
                updated_at = NOW()
            WHERE id = check_record.id;
            
            missed_count := missed_count + 1;
            
            -- Log the missed check
            RAISE NOTICE 'Marked check % for event % as missed (scheduled: % %, current time: % %)', 
                check_record.id, 
                check_record.event_id, 
                check_record.event_date,
                check_record.check_time, 
                CURRENT_DATE,
                CURRENT_TIME;
        ELSE
            RAISE NOTICE 'Check % NOT marked as missed (scheduled: % %, current: % %)', 
                check_record.id, 
                check_record.event_date,
                check_record.check_time, 
                CURRENT_DATE,
                CURRENT_TIME;
        END IF;
    END LOOP;
    
    -- Return count of checks marked as missed
    RETURN missed_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_missed_panopto_checks() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_missed_panopto_checks() TO anon;
