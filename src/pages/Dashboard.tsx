import { useTelemetry } from '@/lib/telemetry'
import { checkSystemHealth } from '@/lib/healthRules'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Cpu, HardDrive, Network, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const stats = useTelemetry()
  const health = checkSystemHealth(stats)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    if (stats) {
      setHistory(prev => {
        const newHistory = [...prev, {
          time: new Date().toLocaleTimeString(),
          cpu: stats.cpu_usage.toFixed(1),
          ram: stats.memory_usage_pct.toFixed(1)
        }].slice(-20)
        return newHistory
      })
    }
  }, [stats])

  if (!stats) {
    return <div className='p-8 text-center'>Cargando telemetría del sistema...</div>
  }

  return (
    <div className='p-8 space-y-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Panel de Control</h1>
          <p className='text-muted-foreground'>Estado actual de los recursos de hardware.</p>
        </div>
        <Badge variant={health.isHealthy ? 'outline' : 'destructive'} className='px-4 py-1 text-sm'>
          {health.isHealthy ? 'Sistema Saludable' : 'Riesgo Crítico'}
        </Badge>
      </div>

      {!health.isHealthy && (
        <Alert variant='destructive' className='border-2'>
          <AlertTriangle className='h-5 w-5' />
          <AlertTitle className='font-bold'>Alertas de Rendimiento</AlertTitle>
          <AlertDescription>
            <ul className='list-disc pl-5 mt-1'>
              {health.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Carga de CPU</CardTitle>
            <Cpu className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.cpu_usage.toFixed(1)}%</div>
            <Progress value={stats.cpu_usage} className='mt-3 h-2' />
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Memoria RAM</CardTitle>
            <Zap className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.memory_usage_pct.toFixed(1)}%</div>
            <Progress value={stats.memory_usage_pct} className='mt-3 h-2' />
            <p className='text-xs text-muted-foreground mt-2'>
              {(stats.used_memory / 1024 / 1024 / 1024).toFixed(1)} GB de {(stats.total_memory / 1024 / 1024 / 1024).toFixed(1)} GB
            </p>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Recibido (Red)</CardTitle>
            <Network className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{(stats.network_rx / 1024 / 1024).toFixed(2)}</div>
            <p className='text-xs text-muted-foreground mt-2'>MB totales recibidos</p>
          </CardContent>
        </Card>

        <Card className='shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Dispositivos</CardTitle>
            <HardDrive className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.disks.length}</div>
            <p className='text-xs text-muted-foreground mt-2'>Unidades de almacenamiento</p>
          </CardContent>
        </Card>
      </div>

      <Card className='shadow-md border-primary/10'>
        <CardHeader>
          <CardTitle>Historial de Rendimiento</CardTitle>
        </CardHeader>
        <CardContent className='h-[400px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray='3 3' opacity={0.3} />
              <XAxis dataKey='time' hide />
              <YAxis domain={[0, 100]} stroke='#888888' fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type='monotone' 
                dataKey='cpu' 
                stroke='#2563eb' 
                strokeWidth={2}
                name='CPU %' 
                dot={false} 
                isAnimationActive={false} 
              />
              <Line 
                type='monotone' 
                dataKey='ram' 
                stroke='#dc2626' 
                strokeWidth={2}
                name='RAM %' 
                dot={false} 
                isAnimationActive={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
