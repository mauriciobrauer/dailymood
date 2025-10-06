"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/login-screen"
import { MoodForm } from "@/components/mood-form"
import { MoodHistory } from "@/components/mood-history"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export default function Home() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [supabaseStatus, setSupabaseStatus] = useState<'testing' | 'success' | 'error' | null>(null)
  const [supabaseMessage, setSupabaseMessage] = useState('')

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
    
    // Test Supabase connection
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    setSupabaseStatus('testing')
    setSupabaseMessage('Probando conexión...')
    
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .limit(1)
      
      if (error) {
        setSupabaseStatus('error')
        setSupabaseMessage('Error de conexión. Revisa el .env.local o las RLS.')
        console.error('Supabase error:', error)
      } else {
        setSupabaseStatus('success')
        setSupabaseMessage('Conexión Supabase OK')
        console.log('Supabase connection successful:', data)
      }
    } catch (err) {
      setSupabaseStatus('error')
      setSupabaseMessage('Error de conexión. Revisa el .env.local o las RLS.')
      console.error('Connection error:', err)
    }
  }

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

        {/* Supabase Connection Status */}
        {supabaseStatus && (
          <Alert className={supabaseStatus === 'success' ? 'border-green-500 bg-green-50' : supabaseStatus === 'error' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'}>
            <div className="flex items-center gap-2">
              {supabaseStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {supabaseStatus === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
              {supabaseStatus === 'testing' && <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
            </div>
            <AlertDescription className={supabaseStatus === 'success' ? 'text-green-800' : supabaseStatus === 'error' ? 'text-red-800' : 'text-blue-800'}>
              {supabaseMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Mood Form */}
        <MoodForm username={currentUser} onMoodSaved={handleMoodSaved} />

        {/* Mood History */}
        <MoodHistory username={currentUser} key={refreshKey} />
      </div>
    </main>
  )
}
