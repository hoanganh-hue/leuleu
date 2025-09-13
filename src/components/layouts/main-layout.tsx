import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ToastContainer } from '@/components/features/toast-container'
import { useAppStore } from '@/stores/app-store'
import { cn } from '@/lib/utils'
import useRealtime from '@/hooks/use-realtime'

export function MainLayout() {
  const { sidebarCollapsed, theme } = useAppStore()
  
  // Initialize realtime subscriptions
  useRealtime()

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className={cn(
      "min-h-screen bg-background transition-colors duration-300",
      theme === 'dark' && 'dark'
    )}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  )
}