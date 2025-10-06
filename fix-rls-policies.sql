-- =====================================================
-- FIX RLS POLICIES FOR CUSTOM USER SYSTEM
-- =====================================================

-- Drop existing policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can insert own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;
DROP POLICY IF EXISTS "Users can delete own mood entries" ON mood_entries;

-- Create new policies that allow public access for custom user system
-- Since we're using a custom user system (not Supabase Auth), we need to allow public access

-- Allow everyone to view mood entries (for the custom user system)
CREATE POLICY "Allow public read access to mood_entries" ON mood_entries
    FOR SELECT USING (true);

-- Allow everyone to insert mood entries (for the custom user system)
CREATE POLICY "Allow public insert access to mood_entries" ON mood_entries
    FOR INSERT WITH CHECK (true);

-- Allow everyone to update mood entries (for the custom user system)
CREATE POLICY "Allow public update access to mood_entries" ON mood_entries
    FOR UPDATE USING (true);

-- Allow everyone to delete mood entries (for the custom user system)
CREATE POLICY "Allow public delete access to mood_entries" ON mood_entries
    FOR DELETE USING (true);

-- Keep the existing policy for users table (this one was already correct)
-- "Users are viewable by everyone" - this stays the same

-- =====================================================
-- ALTERNATIVE: More restrictive policies (if you prefer)
-- =====================================================
-- If you want more security, you can use these instead of the above:

/*
-- More restrictive: Only allow operations if user_id exists in users table
CREATE POLICY "Allow read if user exists" ON mood_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = mood_entries.user_id
        )
    );

CREATE POLICY "Allow insert if user exists" ON mood_entries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = mood_entries.user_id
        )
    );

CREATE POLICY "Allow update if user exists" ON mood_entries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = mood_entries.user_id
        )
    );

CREATE POLICY "Allow delete if user exists" ON mood_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = mood_entries.user_id
        )
    );
*/
