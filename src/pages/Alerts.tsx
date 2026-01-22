import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Bell, ShieldAlert, Cpu, Zap } from 'lucide-react'
import { useState } from 'react'

export default function Alerts() {
  const [cpuThreshold, setCpuThreshold] = useState(90)
  const [ramThreshold, setRamThreshold] = useState(90)

  return (
    <div className='p-8 space-y-6 max-w-4xl mx-auto'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Módulo de Alertas</h1>
        <p className='text-muted-foreground'>Configura las notificaciones para eventos críticos del sistema.</p>
      </div>

      <div className='grid gap-6'>
        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Cpu className='h-5 w-5 text-primary' />
              <CardTitle>Rendimiento del Procesador</CardTitle>
            </div>
            <CardDescription>Notificar cuando el uso del CPU exceda el límite.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='cpu-alert'>Activar alerta de CPU</Label>
              <Switch id='cpu-alert' defaultChecked />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='cpu-threshold'>Umbral de uso (%)</Label>
              <Input 
                id='cpu-threshold' 
                type='number' 
                value={cpuThreshold} 
                onChange={(e) => setCpuThreshold(parseInt(e.target.value))} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Zap className='h-5 w-5 text-yellow-500' />
              <CardTitle>Consumo de Memoria</CardTitle>
            </div>
            <CardDescription>Notificar cuando la memoria RAM esté casi llena.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='ram-alert'>Activar alerta de RAM</Label>
              <Switch id='ram-alert' defaultChecked />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='ram-threshold'>Umbral de uso (%)</Label>
              <Input 
                id='ram-threshold' 
                type='number' 
                value={ramThreshold} 
                onChange={(e) => setRamThreshold(parseInt(e.target.value))} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className='border-dashed'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Bell className='h-5 w-5 text-muted-foreground' />
              <CardTitle>Historial de Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-muted-foreground text-center py-8'>
              No hay alertas recientes registradas.
            </div>
          </CardContent>
        </Card>

        <div className='flex justify-end'>
          <Button className='gap-2'>
            <ShieldAlert className='h-4 w-4' />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  )
}
