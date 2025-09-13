import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjawlnjwzhkyiebjajhl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqYXdsbmp3emhreWllYmphamhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1ODQ3OTksImV4cCI6MjA0OTE2MDc5OX0.0Q_xf6nKRKwF8-8DFRyktUz4ZJqN2p8e1Y_rG5iKaGU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Company {
  tax_code: string
  company_name: string
  legal_representative?: string
  address?: string
  province?: string
  district?: string
  ward?: string
  industry_code?: string
  industry_name?: string
  charter_capital?: number
  establishment_date?: string
  business_status?: string
  phone?: string
  email?: string
  website?: string
  source_website?: string
  created_at: string
  updated_at: string
}

export interface ScrapingJob {
  job_id: string
  job_type: string
  parameters: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: number
  total_records: number
  success_count: number
  proxy_used?: string
  captcha_solved: number
  cost_tracking: number
  created_at: string
  completed_at?: string
  error_logs?: string[]
  user_id?: string
}

export interface ProxyServer {
  proxy_id: string
  proxy_url: string
  proxy_type: 'http' | 'https' | 'socks5'
  country?: string
  status: 'active' | 'inactive' | 'blocked' | 'testing'
  response_time?: number
  success_rate: number
  last_checked?: string
  cost_per_request: number
  provider?: string
  username?: string
  password?: string
  created_at: string
  updated_at: string
}

export interface CaptchaLog {
  captcha_id: string
  captcha_type: string
  image_url?: string
  solution?: string
  solver_service?: string
  cost: number
  solve_time?: number
  success: boolean
  job_id?: string
  created_at: string
}

export interface AdminUser {
  user_id: string
  email: string
  full_name?: string
  role: string
  api_key?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Vietnamese provinces for form options
export const vietnameseProvinces = [
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Quảng Bình',
  'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng',
  'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
  'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long',
  'Vĩnh Phúc', 'Yên Bái', 'Phú Yên', 'Cần Thơ', 'Đà Nẵng',
  'Hải Phòng', 'Hà Nội', 'TP Hồ Chí Minh'
]

// Common industry codes (VSIC)
export const industryCategories = [
  { code: 'A', name: 'Nông, lâm nghiệp và thủy sản' },
  { code: 'B', name: 'Khai khoáng' },
  { code: 'C', name: 'Công nghiệp chế biến, chế tạo' },
  { code: 'D', name: 'Sản xuất và phân phối điện, khí đốt, nước nóng, hơi nước và điều hòa không khí' },
  { code: 'E', name: 'Cung cấp nước; hoạt động quản lý và xử lý rác thải, nước thải' },
  { code: 'F', name: 'Xây dựng' },
  { code: 'G', name: 'Bán buôn và bán lẻ; sửa chữa ô tô, xe máy' },
  { code: 'H', name: 'Vận tải, kho bãi' },
  { code: 'I', name: 'Dịch vụ lưu trú và ăn uống' },
  { code: 'J', name: 'Thông tin và truyền thông' },
  { code: 'K', name: 'Hoạt động tài chính, ngân hàng và bảo hiểm' },
  { code: 'L', name: 'Hoạt động kinh doanh bất động sản' },
  { code: 'M', name: 'Hoạt động chuyên môn, khoa học và công nghệ' },
  { code: 'N', name: 'Hoạt động hành chính và dịch vụ hỗ trợ' },
  { code: 'O', name: 'Quản lý nhà nước, quốc phòng và đảm bảo xã hội bắt buộc' },
  { code: 'P', name: 'Giáo dục và đào tạo' },
  { code: 'Q', name: 'Y tế và hoạt động trợ giúp xã hội' },
  { code: 'R', name: 'Nghệ thuật, vui chơi và giải trí' },
  { code: 'S', name: 'Hoạt động dịch vụ khác' },
  { code: 'T', name: 'Hoạt động làm thuê các công việc trong các hộ gia đình; sản xuất sản phẩm vật chất và dịch vụ tự tiêu dùng của hộ gia đình' },
  { code: 'U', name: 'Hoạt động của các tổ chức và cơ quan quốc tế' }
]