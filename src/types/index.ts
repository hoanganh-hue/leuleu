export type { 
  Company, 
  ScrapingJob, 
  ProxyServer, 
  CaptchaLog, 
  AdminUser 
} from '@/lib/supabase'

export interface SearchFilters {
  province?: string
  industryCode?: string
  businessStatus?: string
  establishmentDateFrom?: string
  establishmentDateTo?: string
  charterCapitalFrom?: number
  charterCapitalTo?: number
  keyword?: string
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json'
  fields: string[]
  filters?: SearchFilters
  limit?: number
}

export interface JobParameters {
  type: 'region' | 'industry'
  province?: string
  industryCode?: string
  limit?: number
  sources?: string[]
  useProxy?: boolean
  solveCaptcha?: boolean
}

export interface ProxyTestResult {
  proxyId: string
  success: boolean
  responseTime?: number
  error?: string
}

export interface CaptchaTask {
  taskId: string
  type: string
  imageUrl?: string
  siteKey?: string
  status: 'pending' | 'solving' | 'solved' | 'failed'
  solution?: string
  cost?: number
}

export interface AnalyticsData {
  totalCompanies: number
  companiesByProvince: Array<{ province: string; count: number }>
  companiesByIndustry: Array<{ industry: string; count: number }>
  jobsStats: {
    total: number
    completed: number
    failed: number
    running: number
  }
  proxyStats: {
    total: number
    active: number
    blocked: number
    avgResponseTime: number
  }
  captchaStats: {
    total: number
    solved: number
    failed: number
    avgSolveTime: number
    totalCost: number
  }
  costTracking: {
    totalCost: number
    proxyCost: number
    captchaCost: number
    avgCostPerJob: number
  }
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  width?: number
  render?: (value: any, row: any) => React.ReactNode
}

export interface PaginationParams {
  page: number
  pageSize: number
  total: number
}

export interface ApiResponse<T> {
  data: T
  error?: string
  success: boolean
}

export interface RealtimeUpdate {
  table: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: any
  old?: any
}