-- Database trigger to automatically create panopto_checks records when events are inserted
-- Run this AFTER creating the panopto_checks table

-- Function to create panopto checks for a new event
CREATE OR REPLACE FUNCTION create_panopto_checks_for_event()
RETURNS TRIGGER AS $$
DECLARE
    check_index INTEGER;
    check_time_value TIME;
    total_checks INTEGER;
BEGIN
    -- Only create checks if the event has start_time and end_time
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        -- Calculate total number of checks (30-minute intervals)
        total_checks := FLOOR(EXTRACT(EPOCH FROM (NEW.end_time::time - NEW.start_time::time)) / 1800);

        -- Create check records for each 30-minute interval
        IF total_checks > 0 THEN
            FOR check_index IN 0..(total_checks - 1) LOOP
                -- Calculate the check time: start_time + (index * 30 minutes)
                check_time_value := (NEW.start_time::time + INTERVAL '30 minutes' * check_index)::time;

                -- Insert the check record
                INSERT INTO panopto_checks (event_id, check_time, completed_time, completed_by_user_id)
                VALUES (NEW.id, check_time_value, NULL, NULL);
            END LOOP;

            RAISE NOTICE 'Created % panopto checks for event %', total_checks, NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after event insertion
CREATE TRIGGER trigger_create_panopto_checks
    AFTER INSERT ON events
    FOR EACH ROW
    EXECUTE FUNCTION create_panopto_checks_for_event();

-- Optional: Also create a function to manually initialize checks for existing events
-- This can be called during migration
CREATE OR REPLACE FUNCTION initialize_panopto_checks_for_existing_events()
RETURNS INTEGER AS $$
DECLARE
    event_record RECORD;
    check_index INTEGER;
    check_time_value TIME;
    total_checks INTEGER;
    processed_count INTEGER := 0;
BEGIN
    -- Loop through events that don't have panopto checks yet
    FOR event_record IN
        SELECT id, start_time, end_time, date
        FROM events
        WHERE start_time IS NOT NULL
        AND end_time IS NOT NULL
        AND id NOT IN (SELECT DISTINCT event_id FROM panopto_checks)
    LOOP
        -- Calculate total number of checks
        total_checks := FLOOR(EXTRACT(EPOCH FROM (event_record.end_time::time - event_record.start_time::time)) / 1800);

        -- Create check records
        IF total_checks > 0 THEN
            FOR check_index IN 0..(total_checks - 1) LOOP
                check_time_value := (event_record.start_time::time + INTERVAL '30 minutes' * check_index)::time;

                INSERT INTO panopto_checks (event_id, check_time, completed_time, completed_by_user_id)
                VALUES (event_record.id, check_time_value, NULL, NULL);
            END LOOP;

            processed_count := processed_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Initialized panopto checks for % existing events', processed_count;
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;
