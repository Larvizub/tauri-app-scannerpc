import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const data = [
  { name: 'Lun', cpu: 45, ram: 60 },
  { name: 'Mar', cpu: 52, ram: 65 },
  { name: 'Mie', cpu: 48, ram: 62 },
  { name: 'Jue', cpu: 70, ram: 75 },
  { name: 'Vie', cpu: 61, ram: 68 },
  { name: 'Sab', cpu: 30, ram: 45 },
  { name: 'Dom', cpu: 25, ram: 40 },
]

export default function Reports() {
  return (
    <div className='p-8 space-y-6 max-w-6xl mx-auto'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Reportes Históricos</h1>
          <p className='text-muted-foreground'>Análisis del rendimiento semanal de tu computadora.</p>
        </div>
        <Button variant='outline' className='gap-2'>
          <Download className='h-4 w-4' />
          Exportar PDF
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Promedio CPU Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>47.2%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Promedio RAM Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>59.4%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Alertas Disparadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            <CardTitle>Rendimiento por Día</CardTitle>
          </div>
        </CardHeader>
        <CardContent className='h-[400px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis dataKey='name' />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey='cpu' fill='#2563eb' name='Promedio CPU %' radius={[4, 4, 0, 0]} />
              <Bar dataKey='ram' fill='#dc2626' name='Promedio RAM %' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
