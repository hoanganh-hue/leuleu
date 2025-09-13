import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Search, 
  Database, 
  Settings, 
  Activity,
  Globe,
  Shield,
  Download,
  BarChart3,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Tổng quan hệ thống'
  },
  {
    name: 'Tạo Job Scraping',
    href: '/jobs/create',
    icon: Search,
    description: 'Tạo job scraping mới'
  },
  {
    name: 'Lịch sử Jobs',
    href: '/jobs',
    icon: Activity,
    description: 'Quản lý jobs'
  },
  {
    name: 'Dữ liệu Công ty',
    href: '/companies',
    icon: Database,
    description: 'Tìm kiếm và xuất dữ liệu'
  },
  {
    name: 'Phân tích',
    href: '/analytics',
    icon: BarChart3,
    description: 'Báo cáo và thống kê'
  },
  {
    name: 'Xuất dữ liệu',
    href: '/export',
    icon: Download,
    description: 'Xuất file Excel, CSV'
  }
]

const adminNavigation = [
  {
    name: 'Quản lý Proxy',
    href: '/admin/proxies',
    icon: Globe,
    description: 'Proxy pool management'
  },
  {
    name: 'CAPTCHA System',
    href: '/admin/captcha',
    icon: Shield,
    description: 'CAPTCHA monitoring'
  },
  {
    name: 'Cài đặt hệ thống',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { isAdmin } = useAuthStore()
  
  const NavItem = ({ item, collapsed }: { item: any; collapsed: boolean }) => (
    <NavLink
      to={item.href}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
        isActive 
          ? "bg-primary text-primary-foreground shadow hover:bg-primary/90" 
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.name : undefined}
    >
      <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-0")} />
      {!collapsed && (
        <div className="flex flex-col">
          <span>{item.name}</span>
          <span className="text-xs opacity-70">{item.description}</span>
        </div>
      )}
    </NavLink>
  )

  return (
    <div className={cn(
      "fixed left-0 top-0 z-50 h-full bg-card border-r transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b",
        sidebarCollapsed && "justify-center px-2"
      )}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Data Scraping</h1>
              <p className="text-xs text-muted-foreground">Enterprise System</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn("h-8 w-8", sidebarCollapsed && "mx-auto")}
        >
          {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
              Chính
            </h2>
          )}
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} collapsed={sidebarCollapsed} />
          ))}
        </div>

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="mt-8 space-y-1">
            {!sidebarCollapsed && (
              <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight text-primary">
                Quản trị
              </h2>
            )}
            {adminNavigation.map((item) => (
              <NavItem key={item.name} item={item} collapsed={sidebarCollapsed} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className={cn(
        "p-4 border-t",
        sidebarCollapsed && "px-2"
      )}>
        {!sidebarCollapsed ? (
          <div className="text-xs text-muted-foreground">
            <p>© 2025 MiniMax Agent</p>
            <p>Enterprise Data Scraping</p>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center mx-auto">
            <span className="text-xs font-bold">DS</span>
          </div>
        )}
      </div>
    </div>
  )
}