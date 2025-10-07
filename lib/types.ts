export interface User {
  id: string
  username: string
  display_name: string
  emoji: string
  created_at: string
  updated_at: string
}

export interface MoodEntry {
  id: string
  user_id: string
  mood_type: 'happy' | 'neutral' | 'sad'
  note: string | null
  entry_date: string
  mood_timestamp?: string | null
  mood_image_url?: string | null
  mood_image_model?: string | null
  mood_image_prompt?: string | null
  created_at: string
  updated_at: string
}

export interface MoodEntryWithUser extends MoodEntry {
  users: User
}
