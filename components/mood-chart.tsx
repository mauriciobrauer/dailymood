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
  happy: number
  neutral: number
  sad: number
  total: number
  timestamp: string
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
    // Group moods by date and count each type
    const groupedByDate: { [key: string]: { happy: number; neutral: number; sad: number; total: number; timestamp: string } } = {}

    moodEntries.forEach(mood => {
      const dateKey = new Date(mood.mood_timestamp || mood.created_at).toISOString().split('T')[0]
      
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          happy: 0,
          neutral: 0,
          sad: 0,
          total: 0,
          timestamp: dateKey
        }
      }

      groupedByDate[dateKey][mood.mood_type]++
      groupedByDate[dateKey].total++
    })

    // Convert to array and format for chart
    const chartDataArray = Object.entries(groupedByDate)
      .map(([date, counts]) => ({
        date: format(new Date(date), 'dd/MM', { locale: es }),
        happy: counts.happy,
        neutral: counts.neutral,
        sad: counts.sad,
        total: counts.total,
        timestamp: date
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.value === 1 ? 'entrada' : 'entradas'}
            </p>
          ))}
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
            <CardTitle>Gráfico de Estados de Ánimo</CardTitle>
            <CardDescription>
              Visualización temporal de tus estados de ánimo
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetDateRange}>
            Últimos 30 días
          </Button>
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
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="happy" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  name="Feliz"
                  dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeWidth={2}
                  name="Neutral"
                  dot={{ fill: "hsl(38, 92%, 50%)", strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sad" 
                  stroke="hsl(199, 89%, 48%)" 
                  strokeWidth={2}
                  name="Triste"
                  dot={{ fill: "hsl(199, 89%, 48%)", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Stats */}
        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {chartData.reduce((sum, day) => sum + day.happy, 0)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">Feliz</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {chartData.reduce((sum, day) => sum + day.neutral, 0)}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">Neutral</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {chartData.reduce((sum, day) => sum + day.sad, 0)}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Triste</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
