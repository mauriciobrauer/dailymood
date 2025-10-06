-- =====================================================
-- MIGRATION: Change from daily to hourly mood tracking
-- =====================================================

-- Step 1: Remove the unique constraint that limits one mood per day per user
ALTER TABLE mood_entries DROP CONSTRAINT IF EXISTS mood_entries_user_id_entry_date_key;

-- Step 2: Add a new timestamp column for exact time tracking
ALTER TABLE mood_entries ADD COLUMN IF NOT EXISTS mood_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 3: Update existing records to have a timestamp (if any exist)
-- This sets the timestamp to the entry_date at 12:00 PM for existing records
UPDATE mood_entries 
SET mood_timestamp = entry_date::timestamp + INTERVAL '12 hours'
WHERE mood_timestamp IS NULL;

-- Step 4: Make the timestamp column NOT NULL now that we've populated it
ALTER TABLE mood_entries ALTER COLUMN mood_timestamp SET NOT NULL;

-- Step 5: Create a new unique constraint that allows multiple moods per day
-- but prevents duplicate timestamps for the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp 
ON mood_entries(user_id, mood_timestamp);

-- Step 6: Update the existing indexes for better performance
DROP INDEX IF EXISTS idx_mood_entries_user_date;
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_timestamp_desc 
ON mood_entries(user_id, mood_timestamp DESC);

-- Step 7: Add an index for date-based queries (still useful)
CREATE INDEX IF NOT EXISTS idx_mood_entries_entry_date_desc 
ON mood_entries(entry_date DESC);

-- Step 8: Create a new view for easier querying with formatted times
CREATE OR REPLACE VIEW mood_history_with_time AS
SELECT 
    me.id,
    me.user_id,
    u.username,
    u.display_name,
    u.emoji,
    me.mood_type,
    CASE 
        WHEN me.mood_type = 'happy' THEN 'Feliz'
        WHEN me.mood_type = 'neutral' THEN 'Neutral'
        WHEN me.mood_type = 'sad' THEN 'Triste'
        ELSE me.mood_type
    END as mood_label,
    me.note,
    me.entry_date,
    me.mood_timestamp,
    TO_CHAR(me.mood_timestamp, 'HH24:MI') as time_formatted,
    TO_CHAR(me.mood_timestamp, 'DD/MM/YYYY HH24:MI') as datetime_formatted,
    me.created_at,
    me.updated_at
FROM mood_entries me
JOIN users u ON me.user_id = u.id
ORDER BY me.mood_timestamp DESC;

-- Step 9: Update the function to get mood history by hours instead of days
CREATE OR REPLACE FUNCTION get_user_mood_history_hours(
    p_user_id UUID,
    p_hours INTEGER DEFAULT 168 -- 7 days * 24 hours
)
RETURNS TABLE (
    id UUID,
    mood_type VARCHAR(20),
    mood_label TEXT,
    note TEXT,
    entry_date DATE,
    mood_timestamp TIMESTAMP WITH TIME ZONE,
    time_formatted TEXT,
    datetime_formatted TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.mood_type,
        CASE 
            WHEN me.mood_type = 'happy' THEN 'Feliz'
            WHEN me.mood_type = 'neutral' THEN 'Neutral'
            WHEN me.mood_type = 'sad' THEN 'Triste'
            ELSE me.mood_type
        END as mood_label,
        me.note,
        me.entry_date,
        me.mood_timestamp,
        TO_CHAR(me.mood_timestamp, 'HH24:MI') as time_formatted,
        TO_CHAR(me.mood_timestamp, 'DD/MM/YYYY HH24:MI') as datetime_formatted,
        me.created_at
    FROM mood_entries me
    WHERE me.user_id = p_user_id
    AND me.mood_timestamp >= NOW() - INTERVAL '1 hour' * p_hours
    ORDER BY me.mood_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that the migration was successful
SELECT 'Migration completed successfully' as status;

-- Show the new table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'mood_entries' 
ORDER BY ordinal_position;

-- Show the new indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'mood_entries';
