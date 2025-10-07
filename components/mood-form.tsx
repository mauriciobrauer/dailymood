"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Smile, Meh, Frown } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { generateMoodImage, DEFAULT_MOOD_IMAGE } from "@/lib/image-generator"

type MoodType = "happy" | "neutral" | "sad"

interface MoodFormProps {
  username: string
  onMoodSaved: () => void
}

export function MoodForm({ username, onMoodSaved }: MoodFormProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMood) return

    setIsSaving(true)
    setIsGeneratingImage(true)

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

      // Generate image based on note and mood (only if note exists)
      let imageUrl = null
      let imageModel = null
      let imagePrompt = null
      
      if (note.trim()) {
        try {
          const imageResult = await generateMoodImage({
            note: note.trim(),
            moodType: selectedMood
          })
          
          if (imageResult.success && imageResult.imageUrl) {
            imageUrl = imageResult.imageUrl
            // Extraer información del modelo y prompt si está disponible
            if (imageResult.debug) {
              imageModel = imageResult.debug.model
              imagePrompt = imageResult.debug.prompt
            }
          } else {
            // Use fallback image if generation fails
            imageUrl = DEFAULT_MOOD_IMAGE
          }
        } catch (imageError) {
          console.error('Error generating image:', imageError)
          // Use fallback image if generation fails
          imageUrl = DEFAULT_MOOD_IMAGE
        }
      }

      setIsGeneratingImage(false)

      // Insert new mood entry with current timestamp
      const now = new Date()
      const today = now.toISOString().split('T')[0] // YYYY-MM-DD format
      
      // Try with mood_timestamp and image_url first, fallback to basic insert if columns don't exist
      let insertError
      
      try {
        // Intentar insert con todos los campos nuevos
        const result = await supabase
          .from('mood_entries')
          .insert({
            user_id: userData.id,
            mood_type: selectedMood,
            note: note.trim() || null,
            entry_date: today,
            mood_timestamp: now.toISOString(),
            mood_image_url: imageUrl,
            mood_image_model: imageModel,
            mood_image_prompt: imagePrompt
          })
        insertError = result.error
      } catch (error) {
        console.log('Fallback: intentando insert básico sin campos nuevos')
        try {
          // Fallback: intentar sin los campos de debug de imagen
          const result = await supabase
            .from('mood_entries')
            .insert({
              user_id: userData.id,
              mood_type: selectedMood,
              note: note.trim() || null,
              entry_date: today,
              mood_timestamp: now.toISOString(),
              mood_image_url: imageUrl
            })
          insertError = result.error
        } catch (fallbackError) {
          console.log('Fallback 2: insert básico sin campos opcionales')
          // Fallback final: insert básico
          const result = await supabase
            .from('mood_entries')
            .insert({
              user_id: userData.id,
              mood_type: selectedMood,
              note: note.trim() || null,
              entry_date: today
            })
          insertError = result.error
        }
      }

      if (insertError) {
        throw insertError
      }

      // Show success message
      const toastMessage = imageUrl 
        ? "¡Estado de ánimo guardado con imagen personalizada! 🎨"
        : "¡Estado de ánimo guardado!"
        
      toast({
        title: toastMessage,
        description: "Tu entrada ha sido registrada exitosamente.",
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
      setIsGeneratingImage(false)
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
            {isSaving ? (
              isGeneratingImage ? "🎨 Generando imagen..." : "Guardando..."
            ) : (
              "Guardar Estado de Ánimo"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
