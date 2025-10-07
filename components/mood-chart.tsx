"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"
import { MoodEntryWithUser } from "@/lib/types"

interface MoodChartProps {
  username: string
}

interface ChartDataPoint {
  date: string
  mood: number // 1=Feliz, 2=Neutral, 3=Triste
  timestamp: string
  moodType: string // Para mostrar en tooltip
  originalDate: string // Fecha base sin offset
  dayIndex: number // Índice del punto en el mismo día
  xIndex: number // Índice secuencial para conexión de línea
}

export function MoodChart({ username }: MoodChartProps) {
  const [moods, setMoods] = useState<MoodEntryWithUser[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState<'from' | 'to' | null>(null)

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

      // Build date range filter
      let query = supabase
        .from('mood_entries')
        .select(`
          *,
          users (*)
        `)
        .eq('user_id', userData.id)
        .order('mood_timestamp', { ascending: true })

      // Apply date filters
      if (dateFrom) {
        query = query.gte('mood_timestamp', dateFrom.toISOString())
      }
      if (dateTo) {
        query = query.lte('mood_timestamp', dateTo.toISOString())
      }

      const { data: moodData, error: moodError } = await query

      if (moodError) {
        console.error('Error loading moods:', moodError)
        setMoods([])
      } else {
        setMoods(moodData || [])
        processChartData(moodData || [])
      }
    } catch (error) {
      console.error('Error loading moods:', error)
      setMoods([])
    } finally {
      setLoading(false)
    }
  }

  const processChartData = (moodEntries: MoodEntryWithUser[]) => {
    // Sort all moods by timestamp first
    const sortedMoods = moodEntries.sort((a, b) => 
      new Date(a.mood_timestamp || a.created_at).getTime() - 
      new Date(b.mood_timestamp || b.created_at).getTime()
    )

    // Convert to chart data with sequential x-coordinates
    const chartDataArray: ChartDataPoint[] = []
    
    sortedMoods.forEach((mood, index) => {
      const moodTimestamp = new Date(mood.mood_timestamp || mood.created_at)
      const moodValue = mood.mood_type === 'happy' ? 1 : mood.mood_type === 'neutral' ? 2 : 3
      const moodTypeLabel = mood.mood_type === 'happy' ? 'Feliz' : mood.mood_type === 'neutral' ? 'Neutral' : 'Triste'
      
      // Use sequential index as x-coordinate for proper line connection
      const baseDate = format(moodTimestamp, 'dd/MM', { locale: es })
      const dateWithOffset = `${baseDate} (${index + 1})`
      
      chartDataArray.push({
        date: dateWithOffset,
        mood: moodValue,
        timestamp: moodTimestamp.toISOString(),
        moodType: moodTypeLabel,
        originalDate: baseDate,
        dayIndex: index,
        xIndex: index // Add sequential index for proper line connection
      })
    })

    setChartData(chartDataArray)
  }

  useEffect(() => {
    loadMoods()
  }, [username, dateFrom, dateTo])

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateFrom(from)
    setDateTo(to)
  }

  const resetDateRange = () => {
    setDateFrom(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    setDateTo(new Date())
  }

  // Función para obtener el color del punto basado en el valor del mood
  const getMoodColor = (moodValue: number) => {
    switch (moodValue) {
      case 1: return "hsl(142, 76%, 36%)" // Verde para Feliz
      case 2: return "hsl(38, 92%, 50%)"  // Amarillo para Neutral
      case 3: return "hsl(199, 89%, 48%)" // Azul para Triste
      default: return "hsl(var(--muted-foreground))"
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const moodLabel = data.moodType
      const moodValue = data.mood
      const timestamp = new Date(data.timestamp)
      const timeStr = format(timestamp, 'HH:mm', { locale: es })
      
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{data.originalDate} - {timeStr}</p>
          <p className="text-sm" style={{ color: getMoodColor(moodValue) }}>
            Estado: {moodLabel} ({moodValue === 1 ? '😊' : moodValue === 2 ? '😐' : '😢'})
          </p>
          {data.dayIndex > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Punto #{data.dayIndex + 1} del día
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evolución del Estado de Ánimo</CardTitle>
            <CardDescription>
              Línea temporal: 1=Feliz, 2=Neutral, 3=Triste
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetDateRange}>
              Últimos 30 días
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Desde</label>
            <Popover open={isCalendarOpen === 'from'} onOpenChange={(open) => setIsCalendarOpen(open ? 'from' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date)
                    setIsCalendarOpen(null)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Hasta</label>
            <Popover open={isCalendarOpen === 'to'} onOpenChange={(open) => setIsCalendarOpen(open ? 'to' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date)
                    setIsCalendarOpen(null)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Cargando gráfico...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <p>No hay datos para mostrar</p>
            <p className="text-sm">Registra algunos estados de ánimo para ver el gráfico</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                <XAxis 
                  dataKey="xIndex" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value, index) => {
                    if (chartData[index]) {
                      return chartData[index].originalDate
                    }
                    return value
                  }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0.5, 3.5]}
                  ticks={[1, 2, 3]}
                  tickFormatter={(value) => {
                    switch (value) {
                      case 1: return 'Feliz'
                      case 2: return 'Neutral'
                      case 3: return 'Triste'
                      default: return value
                    }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={getMoodColor(payload.mood)}
                        stroke="white"
                        strokeWidth={2}
                      />
                    )
                  }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {chartData.filter(point => point.mood === 1).length}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Feliz 😊
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {chartData.filter(point => point.mood === 2).length}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Neutral 😐
              </p>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {chartData.filter(point => point.mood === 3).length}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Triste 😢
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
