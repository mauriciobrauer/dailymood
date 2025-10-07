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
      // Try with mood_timestamp first, fallback to entry_date if column doesn't exist yet
      let moodData, moodError
      
      try {
        // Try the new structure with mood_timestamp
        const result = await supabase
          .from('mood_entries')
          .select(`
            *,
            users (*)
          `)
          .eq('user_id', userData.id)
          .gte('mood_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('mood_timestamp', { ascending: false })
          .limit(20)
        
        moodData = result.data
        moodError = result.error
      } catch (error) {
        // Fallback to old structure with entry_date
        const result = await supabase
          .from('mood_entries')
          .select(`
            *,
            users (*)
          `)
          .eq('user_id', userData.id)
          .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('created_at', { ascending: false })
          .limit(20)
        
        moodData = result.data
        moodError = result.error
      }

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

    // Check if this is a full timestamp or just a date
    const hasTime = dateString.includes('T') && dateString.includes(':')
    
    if (hasTime) {
      // Full timestamp - show time
      const timeString = date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      })

      if (date.toDateString() === today.toDateString()) {
        return `Hoy ${timeString}`
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Ayer ${timeString}`
      } else {
        const dateStr = date.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
        return `${dateStr} ${timeString}`
      }
    } else {
      // Just date - show without time
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
  }

  // Expose loadMoods function to parent component
  useEffect(() => {
    // This will be called when the component mounts or when username changes
    // The parent can trigger a refresh by changing the key prop
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Estados de Ánimo</CardTitle>
        <CardDescription>Revisa tus estados de ánimo de los últimos 7 días con hora</CardDescription>
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
                    <p className="text-xs text-muted-foreground">{formatDate(mood.mood_timestamp || mood.created_at)}</p>
                  </div>
                </div>
                <div className="flex-1">
                  {mood.note ? (
                    <div className="space-y-3">
                      <p className="text-sm text-foreground leading-relaxed">{mood.note}</p>
                      {mood.mood_image_url && (
                        <div className="mt-2">
                          <img
                            src={mood.mood_image_url}
                            alt={`Imagen generada para: ${mood.note.slice(0, 50)}...`}
                            className="w-full max-w-xs rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow duration-200"
                            onError={(e) => {
                              // Fallback si la imagen falla al cargar
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://source.unsplash.com/400x400/?cute-cat';
                              target.alt = 'Imagen por defecto - gatito lindo';
                            }}
                          />
                          <div className="mt-1 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              🎨 Imagen generada por IA
                            </p>
                            {mood.mood_image_model && (
                              <p className="text-xs text-blue-600 font-medium">
                                🤖 Modelo: {mood.mood_image_model}
                              </p>
                            )}
                            {mood.mood_image_prompt && (
                              <details className="text-xs">
                                <summary className="text-purple-600 font-medium cursor-pointer hover:text-purple-700">
                                  📝 Ver prompt usado
                                </summary>
                                <div className="mt-1 p-2 bg-muted rounded text-xs text-muted-foreground max-w-md">
                                  {mood.mood_image_prompt}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
