-- Add the missing foreign key constraint for completed_by_user_id to profiles.id
-- The existing constraint is for event_id to events.id, we need one for user_id to profiles.id

-- Add foreign key from panopto_checks.completed_by_user_id to profiles.id
ALTER TABLE panopto_checks 
ADD CONSTRAINT panopto_checks_completed_by_user_id_fkey 
FOREIGN KEY (completed_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'panopto_checks';
