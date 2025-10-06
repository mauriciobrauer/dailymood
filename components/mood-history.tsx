"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Meh, Frown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MoodEntryWithUser } from "@/lib/types"

interface MoodHistoryProps {
  username: string
}

export function MoodHistory({ username }: MoodHistoryProps) {
  const [moods, setMoods] = useState<MoodEntryWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const loadMoods = async () => {
    try {
      setLoading(true)
      
      // Get user ID from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (userError || !userData) {
        console.error('User not found:', userError)
        setMoods([])
        return
      }

      // Get mood entries for the last 7 days
      const { data: moodData, error: moodError } = await supabase
        .from('mood_entries')
        .select(`
          *,
          users (*)
        `)
        .eq('user_id', userData.id)
        .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('entry_date', { ascending: false })
        .limit(7)

      if (moodError) {
        console.error('Error loading moods:', moodError)
        setMoods([])
      } else {
        setMoods(moodData || [])
      }
    } catch (error) {
      console.error('Error loading moods:', error)
      setMoods([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMoods()
  }, [username])

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "happy":
        return <Smile className="w-5 h-5 text-green-500" />
      case "neutral":
        return <Meh className="w-5 h-5 text-amber-500" />
      case "sad":
        return <Frown className="w-5 h-5 text-blue-500" />
      default:
        return null
    }
  }

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case "happy":
        return "Feliz"
      case "neutral":
        return "Neutral"
      case "sad":
        return "Triste"
      default:
        return mood
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    }
  }

  // Expose loadMoods function to parent component
  useEffect(() => {
    // This will be called when the component mounts or when username changes
    // The parent can trigger a refresh by changing the key prop
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de los Últimos 7 Días</CardTitle>
        <CardDescription>Revisa cómo te has sentido recientemente</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Cargando historial...</p>
          </div>
        ) : moods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aún no has registrado ningún estado de ánimo.</p>
            <p className="text-sm mt-1">¡Comienza registrando cómo te sientes hoy!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {moods.map((mood) => (
              <div key={mood.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3 min-w-[140px]">
                  {getMoodIcon(mood.mood_type)}
                  <div>
                    <p className="font-medium text-sm">{getMoodLabel(mood.mood_type)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(mood.entry_date)}</p>
                  </div>
                </div>
                <div className="flex-1">
                  {mood.note ? (
                    <p className="text-sm text-foreground leading-relaxed">{mood.note}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Sin nota</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
