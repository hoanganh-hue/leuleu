import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/features/status-badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import {
  Database,
  Activity,
  Globe,
  Shield,
  TrendingUp,
  Users,
  DollarSign,
  Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'

// Sample data for charts
const companiesByProvince = [
  { name: 'Hà Nội', count: 2340 },
  { name: 'TP.HCM', count: 3456 },
  { name: 'Đà Nẵng', count: 876 },
  { name: 'Hải Phòng', count: 654 },
  { name: 'Cần Thơ', count: 432 },
]

const companiesByIndustry = [
  { name: 'Chế tạo', value: 35, color: '#3b82f6' },
  { name: 'Bán lẻ', value: 25, color: '#10b981' },
  { name: 'Xây dựng', value: 20, color: '#f59e0b' },
  { name: 'Công nghệ', value: 15, color: '#ef4444' },
  { name: 'Khác', value: 5, color: '#8b5cf6' },
]

const recentJobs = [
  {
    id: '1',
    type: 'region',
    parameters: { province: 'Hà Nội' },
    status: 'running',
    progress: 65,
    success_count: 850,
    total_records: 1200,
    created_at: '2025-08-01T15:30:00Z'
  },
  {
    id: '2',
    type: 'industry',
    parameters: { industryCode: 'C' },
    status: 'completed',
    progress: 100,
    success_count: 2340,
    total_records: 2340,
    created_at: '2025-08-01T14:15:00Z'
  },
  {
    id: '3',
    type: 'region',
    parameters: { province: 'TP.HCM' },
    status: 'failed',
    progress: 25,
    success_count: 320,
    total_records: 1800,
    created_at: '2025-08-01T13:45:00Z'
  }
]

export function Dashboard() {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()

  const stats = {
    totalCompanies: 8758,
    totalJobs: 156,
    activeProxies: 23,
    successRate: 87.5,
    totalCost: 234.56,
    avgJobTime: 45
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-job':
        navigate('/jobs/create')
        break
      case 'export':
        navigate('/export')
        break
      case 'proxies':
        navigate('/admin/proxies')
        break
      default:
        addNotification({
          type: 'info',
          title: 'Tính năng đang phát triển',
          message: 'Tính năng này đang được phát triển'
        })
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Tổng quan và giám sát hệ thống scraping
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleQuickAction('new-job')}>
            Tạo Job mới
          </Button>
          <Button variant="outline" onClick={() => handleQuickAction('export')}>
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng công ty</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              8 jobs đang chạy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proxy hoạt động</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProxies}</div>
            <p className="text-xs text-muted-foreground">
              Tỷ lệ thành công: {stats.successRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi phí tháng</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost}</div>
            <p className="text-xs text-muted-foreground">
              -5% so với tháng trước
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Companies by Province Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo tỉnh thành</CardTitle>
            <CardDescription>
              Số lượng công ty theo các tỉnh thành chính
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companiesByProvince}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Companies by Industry Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo ngành nghề</CardTitle>
            <CardDescription>
              Tỷ lệ phần trăm theo các ngành nghề chính
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={companiesByIndustry}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {companiesByIndustry.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Jobs gần đây
          </CardTitle>
          <CardDescription>
            Trạng thái các job scraping mới nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {job.type === 'region' ? 'Scrape theo tỉnh' : 'Scrape theo ngành'}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {job.type === 'region' 
                        ? `Tỉnh: ${job.parameters.province}`
                        : `Ngành: ${job.parameters.industryCode}`
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {job.success_count.toLocaleString()} / {job.total_records.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  
                  <div className="w-24">
                    <Progress value={job.progress} className="h-2" />
                    <div className="text-xs text-center mt-1">{job.progress}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={() => navigate('/jobs')}>
              Xem tất cả jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>
            Các chức năng thường dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => handleQuickAction('new-job')}
            >
              <Activity className="h-6 w-6" />
              <span>Tạo Job Scraping</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => handleQuickAction('export')}
            >
              <Database className="h-6 w-6" />
              <span>Xuất dữ liệu</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => handleQuickAction('proxies')}
            >
              <Globe className="h-6 w-6" />
              <span>Quản lý Proxy</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col gap-2"
              onClick={() => handleQuickAction('analytics')}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Phân tích</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}