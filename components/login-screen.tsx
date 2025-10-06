"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { User } from "@/lib/types"

interface LoginScreenProps {
  onLogin: (username: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('display_name')

        if (error) {
          console.error('Error loading users:', error)
        } else {
          setUsers(data || [])
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleUserSelect = (username: string) => {
    setSelectedUser(username)
    // Auto-login after selection
    setTimeout(() => {
      onLogin(username)
    }, 200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenido</CardTitle>
          <CardDescription>Selecciona tu usuario para comenzar a registrar tu estado de ánimo</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Cargando usuarios...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {users.map((user) => (
                <Button
                  key={user.id}
                  variant={selectedUser === user.username ? "default" : "outline"}
                  className="h-24 flex flex-col items-center justify-center gap-2 text-base"
                  onClick={() => handleUserSelect(user.username)}
                >
                  <span className="text-3xl">{user.emoji}</span>
                  <span className="text-sm font-medium">{user.display_name}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
