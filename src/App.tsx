import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Dashboard from '@/pages/Dashboard'
import Alerts from '@/pages/Alerts'
import Reports from '@/pages/Reports'
import Apps from '@/pages/Apps'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Bell, FileBarChart, Package } from 'lucide-react'
import { useFirebaseSync } from '@/hooks/useFirebaseSync'

function App() {
  useFirebaseSync()

  return (
    <ThemeProvider defaultTheme='system' storageKey='scannerpc-theme'>
      <Router>
        <div className='flex h-screen bg-background text-foreground'>
          <aside className='w-64 border-r bg-card p-4 flex flex-col gap-4'>
            <div className='px-2 py-4'>
              <h1 className='text-xl font-bold tracking-tight'>ScannerPC</h1>
            </div>
            <nav className='flex-1 flex flex-col gap-2'>
              <Link to='/'>
                <Button variant='ghost' className='w-full justify-start gap-2'>
                  <LayoutDashboard className='h-4 w-4' />
                  Dashboard
                </Button>
              </Link>
              <Link to='/alerts'>
                <Button variant='ghost' className='w-full justify-start gap-2'>
                  <Bell className='h-4 w-4' />
                  Alertas
                </Button>
              </Link>
              <Link to='/reports'>
                <Button variant='ghost' className='w-full justify-start gap-2'>
                  <FileBarChart className='h-4 w-4' />
                  Reportes
                </Button>
              </Link>
              <Link to='/apps'>
                <Button variant='ghost' className='w-full justify-start gap-2'>
                  <Package className='h-4 w-4' />
                  Aplicaciones
                </Button>
              </Link>
            </nav>
          </aside>
          <main className='flex-1 overflow-auto'>
            <Routes>
              <Route path='/' element={<Dashboard />} />
              <Route path='/alerts' element={<Alerts />} />
              <Route path='/reports' element={<Reports />} />
              <Route path='/apps' element={<Apps />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App
