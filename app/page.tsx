"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/login-screen"
import { MoodForm } from "@/components/mood-form"
import { MoodHistory } from "@/components/mood-history"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Clear localStorage if it contains JSON data (legacy cleanup)
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        // If it's JSON, clear it and don't auto-login
        if (userData.username || userData.id) {
          localStorage.removeItem("currentUser")
          console.log("Cleared legacy JSON data from localStorage")
          return
        }
      } catch {
        // If it's not JSON, treat as username (this is correct)
        setCurrentUser(savedUser)
        setCurrentUserName(savedUser)
      }
    }
  }, [])

  const handleLogin = async (username: string) => {
    try {
      // Get user data from Supabase to get display name
      const { data: userData } = await supabase
        .from('users')
        .select('username, display_name')
        .eq('username', username)
        .single()

      const displayName = userData?.display_name || username
      
      localStorage.setItem("currentUser", username)
      setCurrentUser(username)
      setCurrentUserName(displayName)
    } catch (error) {
      // Fallback if database query fails
      localStorage.setItem("currentUser", username)
      setCurrentUser(username)
      setCurrentUserName(username)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    setCurrentUser(null)
    setCurrentUserName(null)
  }

  const clearStorage = () => {
    localStorage.clear()
    setCurrentUser(null)
    setCurrentUserName(null)
    window.location.reload()
  }

  const handleMoodSaved = () => {
    // Trigger refresh of history table
    setRefreshKey((prev) => prev + 1)
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Seguimiento de Estado de Ánimo</h1>
            <p className="text-muted-foreground mt-1">
              Hola, <span className="font-medium text-foreground">{currentUserName || currentUser}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearStorage} size="sm">
              Limpiar Cache
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>


        {/* Mood Form */}
        <MoodForm username={currentUser} onMoodSaved={handleMoodSaved} />

        {/* Mood History */}
        <MoodHistory username={currentUser} key={refreshKey} />
      </div>
    </main>
  )
}
