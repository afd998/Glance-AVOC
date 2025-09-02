-- Fix the foreign key relationship between panopto_checks and profiles tables
-- This allows us to join panopto_checks with profiles to show user names

-- First, drop the existing foreign key to auth.users if it exists
ALTER TABLE panopto_checks 
DROP CONSTRAINT IF EXISTS panopto_checks_completed_by_user_id_fkey;

-- Add the foreign key to the public.profiles table instead
ALTER TABLE panopto_checks 
ADD CONSTRAINT panopto_checks_completed_by_user_id_fkey 
FOREIGN KEY (completed_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Update the types/supabase.ts file to include this relationship
-- Add this to the panopto_checks Relationships array:
/*
{
  foreignKeyName: "panopto_checks_completed_by_user_id_fkey"
  columns: ["completed_by_user_id"]
  isOneToOne: false
  referencedRelation: "profiles"
  referencedColumns: ["id"]
}
*/
