import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { MainLayout } from '@/components/layouts/main-layout'
import { Dashboard } from '@/pages/dashboard'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import './index.css'

// Placeholder components for other pages
const CreateJob = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Tạo Job Scraping</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const JobsList = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Lịch sử Jobs</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const Companies = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Dữ liệu Công ty</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const Analytics = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Phân tích</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const Export = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Xuất Dữ liệu</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const AdminProxies = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Quản lý Proxy</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const AdminCaptcha = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">CAPTCHA System</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

const AdminSettings = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">Cài đặt Hệ thống</h2>
      <p className="text-muted-foreground">Trang này đang được phát triển...</p>
    </div>
  </div>
)

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  React.useEffect(() => {
    // Check initial session
    const getInitialSession = async () => {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading])

  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="jobs/create" element={<CreateJob />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="companies" element={<Companies />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="export" element={<Export />} />
                <Route path="admin/proxies" element={<AdminProxies />} />
                <Route path="admin/captcha" element={<AdminCaptcha />} />
                <Route path="admin/settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App