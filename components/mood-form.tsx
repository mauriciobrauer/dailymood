"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Smile, Meh, Frown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type MoodType = "happy" | "neutral" | "sad"

interface MoodFormProps {
  username: string
  onMoodSaved: () => void
}

export function MoodForm({ username, onMoodSaved }: MoodFormProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMood) return

    setIsSaving(true)

    try {
      // Get user ID from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (userError || !userData) {
        throw new Error('Usuario no encontrado')
      }

      // Insert or update mood entry for today
      const { error: insertError } = await supabase
        .from('mood_entries')
        .upsert({
          user_id: userData.id,
          mood_type: selectedMood,
          note: note.trim() || null,
          entry_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
        })

      if (insertError) {
        throw insertError
      }

      // Show success message
      toast({
        title: "Estado de ánimo guardado",
        description: "Tu estado de ánimo se ha registrado correctamente.",
      })

      // Reset form
      setSelectedMood(null)
      setNote("")
      onMoodSaved()

    } catch (error) {
      console.error('Error saving mood:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar tu estado de ánimo. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const moodButtons = [
    { type: "happy" as MoodType, label: "Feliz", icon: Smile, color: "bg-green-500 hover:bg-green-600 text-white" },
    { type: "neutral" as MoodType, label: "Neutral", icon: Meh, color: "bg-amber-500 hover:bg-amber-600 text-white" },
    { type: "sad" as MoodType, label: "Triste", icon: Frown, color: "bg-blue-500 hover:bg-blue-600 text-white" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>¿Cómo te sientes hoy?</CardTitle>
        <CardDescription>Registra tu estado de ánimo y añade una nota opcional</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Buttons */}
          <div className="grid grid-cols-3 gap-4">
            {moodButtons.map((mood) => {
              const Icon = mood.icon
              const isSelected = selectedMood === mood.type

              return (
                <button
                  key={mood.type}
                  type="button"
                  onClick={() => setSelectedMood(mood.type)}
                  className={`
                    flex flex-col items-center justify-center gap-3 p-6 rounded-lg
                    transition-all duration-200 border-2
                    ${
                      isSelected
                        ? `${mood.color} border-transparent scale-105 shadow-lg`
                        : "bg-card border-border hover:border-muted-foreground/50"
                    }
                  `}
                >
                  <Icon className={`w-12 h-12 ${isSelected ? "text-white" : "text-muted-foreground"}`} />
                  <span className={`font-medium ${isSelected ? "text-white" : "text-foreground"}`}>{mood.label}</span>
                </button>
              )
            })}
          </div>

          {/* Note Field */}
          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              Nota (opcional)
            </label>
            <Textarea
              id="note"
              placeholder="¿Qué pasó hoy? ¿Cómo te sientes?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={!selectedMood || isSaving} className="w-full" size="lg">
            {isSaving ? "Guardando..." : "Guardar Estado de Ánimo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
