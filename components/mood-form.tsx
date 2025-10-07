"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Smile, Meh, Frown, X } from "lucide-react"
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
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para generar mensaje positivo basado en mood y nota
  const generatePositiveMessage = (mood: MoodType, note: string) => {
    const moodMessages = {
      happy: [
        "¡Qué genial que te sientas feliz! 😊",
        "¡Me alegra saber que estás de buen humor! 🌟",
        "¡Qué bueno que tengas un día alegre! ✨",
        "¡Tu felicidad es contagiosa! 🎉"
      ],
      neutral: [
        "Es perfectamente normal sentirse neutral. 😌",
        "Los días tranquilos también son valiosos. 🌸",
        "A veces necesitamos estos momentos de calma. 🕊️",
        "Tu equilibrio emocional es admirable. ⚖️"
      ],
      sad: [
        "Es valiente que compartas cómo te sientes. 💙",
        "Los días difíciles también pasan. 🌈",
        "Reconocer tus emociones es el primer paso. 🤗",
        "Está bien no estar bien a veces. 💜"
      ]
    }

    const noteMessages = {
      happy: [
        "Gracias por compartir tu alegría con nosotros.",
        "Es hermoso ver cómo disfrutas los pequeños momentos.",
        "Tu positividad ilumina el día de todos.",
        "Que sigas teniendo muchos momentos así."
      ],
      neutral: [
        "Gracias por ser honesto sobre cómo te sientes.",
        "Cada día es una oportunidad de crecimiento.",
        "Tu autenticidad es muy valiosa.",
        "Es importante escuchar todas nuestras emociones."
      ],
      sad: [
        "Gracias por confiar en nosotros con tus sentimientos.",
        "Recuerda que no estás solo en esto.",
        "Es valiente expresar lo que sientes.",
        "Cada día es una nueva oportunidad."
      ]
    }

    const moodMessage = moodMessages[mood][Math.floor(Math.random() * moodMessages[mood].length)]
    const noteMessage = noteMessages[mood][Math.floor(Math.random() * noteMessages[mood].length)]
    
    return { moodMessage, noteMessage }
  }

  // Función para cerrar el dialog y resetear el formulario
  const handleCloseDialog = () => {
    setShowImageDialog(false)
    setGeneratedImageUrl(null)
    setSelectedMood(null)
    setNote("")
    onMoodSaved()
  }

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
      
      // Intentar insert con todos los campos nuevos primero
      let result = await supabase
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
      
      // Si hay error de columna no encontrada, intentar fallback
      if (insertError && (insertError.code === 'PGRST204' || insertError.message?.includes('mood_image_model'))) {
        console.log('Fallback: columnas de debug no existen, intentando sin ellas')
        
        result = await supabase
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
        
        // Si aún hay error, intentar fallback final
        if (insertError && (insertError.code === 'PGRST204' || insertError.message?.includes('mood_image_url'))) {
          console.log('Fallback 2: columnas de imagen no existen, insert básico')
          
          result = await supabase
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

      // Si se generó una imagen, mostrar el dialog
      if (imageUrl) {
        setGeneratedImageUrl(imageUrl)
        setShowImageDialog(true)
      } else {
        // Reset form solo si no hay imagen
        setSelectedMood(null)
        setNote("")
        onMoodSaved()
      }

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
    <div>
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

      {/* Dialog para mostrar la imagen generada */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🎨 ¡Tu imagen personalizada!</DialogTitle>
            <DialogDescription className="text-center">
              {selectedMood && note && generatePositiveMessage(selectedMood, note).moodMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Imagen generada */}
            {generatedImageUrl && (
              <div className="relative">
                <img 
                  src={generatedImageUrl} 
                  alt="Imagen generada para tu estado de ánimo"
                  className="w-full h-64 object-cover rounded-lg border"
                  onError={(e) => {
                    // Fallback si la imagen no carga
                    e.currentTarget.src = DEFAULT_MOOD_IMAGE
                  }}
                />
              </div>
            )}
            
            {/* Mensaje positivo personalizado */}
            {selectedMood && note && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {generatePositiveMessage(selectedMood, note).noteMessage}
                </p>
                {note && (
                  <p className="text-xs text-muted-foreground italic">
                    "{note}"
                  </p>
                )}
              </div>
            )}
            
            {/* Botón para cerrar */}
            <Button 
              onClick={handleCloseDialog} 
              className="w-full"
              size="lg"
            >
              ¡Gracias! Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
