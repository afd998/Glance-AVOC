-- Create whitelist table
CREATE TABLE IF NOT EXISTS public.email_whitelist (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    domain TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Insert some example Northwestern emails
INSERT INTO public.email_whitelist (email, domain, role, created_by) VALUES
('admin@northwestern.edu', 'northwestern.edu', 'admin', 'system'),
('faculty@northwestern.edu', 'northwestern.edu', 'faculty', 'system'),
('student@northwestern.edu', 'northwestern.edu', 'student', 'system');

-- Enable RLS on the whitelist table
ALTER TABLE public.email_whitelist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read whitelist
CREATE POLICY "Allow authenticated users to read whitelist" ON public.email_whitelist
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow admins to manage whitelist
CREATE POLICY "Allow admins to manage whitelist" ON public.email_whitelist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.email_whitelist 
            WHERE email = auth.jwt() ->> 'email' 
            AND role = 'admin'
        )
    );

-- Create a function to check if email is whitelisted
CREATE OR REPLACE FUNCTION public.is_email_whitelisted(email_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.email_whitelist 
        WHERE email = email_to_check 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_email_whitelisted(TEXT) TO authenticated; 