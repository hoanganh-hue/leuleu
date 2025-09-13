// API endpoints
export const API_ENDPOINTS = {
  SCRAPE_COMPANIES: '/functions/v1/scrape-companies',
  MANAGE_PROXIES: '/functions/v1/manage-proxies',
  SOLVE_CAPTCHA: '/functions/v1/solve-captcha',
  EXPORT_DATA: '/functions/v1/export-data',
  ANALYTICS: '/functions/v1/analytics',
} as const

// Scraping sources
export const SCRAPING_SOURCES = {
  INFODOANHNGHIEP: 'infodoanhnghiep.com',
  HSCTVN: 'hsctvn.com',
  MASOTHUE: 'masothue.com',
} as const

// Job statuses
export const JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
} as const

// Proxy types
export const PROXY_TYPES = {
  HTTP: 'http',
  HTTPS: 'https',
  SOCKS5: 'socks5',
} as const

// Captcha types
export const CAPTCHA_TYPES = {
  RECAPTCHA_V2: 'recaptcha_v2',
  RECAPTCHA_V3: 'recaptcha_v3',
  HCAPTCHA: 'hcaptcha',
  TEXT_CAPTCHA: 'text_captcha',
  IMAGE_CAPTCHA: 'image_captcha',
} as const

// Captcha solver services
export const CAPTCHA_SOLVERS = {
  TWOCAPTCHA: '2captcha',
  ANTICAPTCHA: 'anticaptcha',
  MANUAL: 'manual',
} as const

// Cost tracking
export const COST_TYPES = {
  PROXY_USAGE: 'proxy_usage',
  CAPTCHA_SOLVING: 'captcha_solving',
  API_CALLS: 'api_calls',
} as const

// Export formats
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
} as const

// Theme colors for enterprise design
export const THEME_COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const

// Real-time update intervals (ms)
export const UPDATE_INTERVALS = {
  JOB_PROGRESS: 2000,
  PROXY_HEALTH: 30000,
  DASHBOARD_STATS: 10000,
} as const