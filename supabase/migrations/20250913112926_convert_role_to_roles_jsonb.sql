-- Migration: Convert role column from text to JSONB roles array
-- This migration:
-- 1. Adds a new 'roles' column as JSONB
-- 2. Transfers existing role data to the new column as an array
-- 3. Drops the old 'role' column

-- Step 1: Add the new 'roles' column as JSONB
ALTER TABLE profiles 
ADD COLUMN roles JSONB DEFAULT '[]'::jsonb;

-- Step 2: Transfer existing role data to the new roles column
-- Convert each existing role value to an array format
UPDATE profiles 
SET roles = CASE 
    WHEN role IS NULL OR role = '' THEN '[]'::jsonb
    ELSE jsonb_build_array(role)
END;

-- Step 3: Make the roles column NOT NULL (optional, adjust as needed)
ALTER TABLE profiles 
ALTER COLUMN roles SET NOT NULL;

-- Step 4: Drop the old 'role' column
ALTER TABLE profiles 
DROP COLUMN role;

-- Optional: Add an index on the roles column for better query performance
CREATE INDEX idx_profiles_roles ON profiles USING GIN (roles);

-- Optional: Add a check constraint to ensure roles is always an array
ALTER TABLE profiles 
ADD CONSTRAINT check_roles_is_array CHECK (jsonb_typeof(roles) = 'array');
