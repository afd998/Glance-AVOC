-- Create a profiles table in the public schema that mirrors auth.users
-- This allows us to join with panopto_checks to show user names

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles (for display purposes)
CREATE POLICY "Users can view profiles" ON profiles
    FOR SELECT USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;

-- Optional: Create a view for panopto checks with user details
CREATE OR REPLACE VIEW panopto_checks_with_users AS
SELECT
    pc.*,
    p.email as user_email,
    p.full_name as user_full_name,
    e.event_name,
    e.date,
    e.start_time,
    e.end_time
FROM panopto_checks pc
LEFT JOIN profiles p ON pc.completed_by_user_id = p.id
LEFT JOIN events e ON pc.event_id = e.id;

GRANT ALL ON panopto_checks_with_users TO authenticated;
GRANT ALL ON panopto_checks_with_users TO anon;
