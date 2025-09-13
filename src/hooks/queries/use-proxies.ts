import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProxyServer, ProxyTestResult } from '@/types'
import { useNotification } from '@/hooks/use-notification'

// Get all proxies
export function useProxies() {
  return useQuery({
    queryKey: ['proxies'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-proxies', {
        body: {},
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (error) throw error
      return data.data as ProxyServer[]
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Add new proxy
export function useAddProxy() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (proxyData: {
      proxy_url: string
      proxy_type: string
      country?: string
      provider?: string
      username?: string
      password?: string
      cost_per_request?: number
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-proxies?action=add', {
        body: proxyData
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] })
      showSuccess('Proxy đã được thêm thành công')
    },
    onError: (error: any) => {
      showError('Lỗi thêm proxy', error.message)
    },
  })
}

// Test proxy
export function useTestProxy() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (proxyData: {
      proxy_id: string
      proxy_url: string
      proxy_type: string
      username?: string
      password?: string
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-proxies?action=test', {
        body: proxyData
      })

      if (error) throw error
      return data.data as ProxyTestResult
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] })
      if (result.success) {
        showSuccess('Test proxy thành công', `Response time: ${result.responseTime}ms`)
      } else {
        showError('Test proxy thất bại', result.error || 'Unknown error')
      }
    },
    onError: (error: any) => {
      showError('Lỗi test proxy', error.message)
    },
  })
}

// Update proxy
export function useUpdateProxy() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async ({ proxy_id, ...updates }: Partial<ProxyServer> & { proxy_id: string }) => {
      const { data, error } = await supabase.functions.invoke('manage-proxies?action=update', {
        body: { proxy_id, ...updates }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] })
      showSuccess('Proxy đã được cập nhật thành công')
    },
    onError: (error: any) => {
      showError('Lỗi cập nhật proxy', error.message)
    },
  })
}

// Delete proxy
export function useDeleteProxy() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (proxy_id: string) => {
      const { data, error } = await supabase.functions.invoke('manage-proxies?action=delete', {
        body: { proxy_id }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] })
      showSuccess('Proxy đã được xóa thành công')
    },
    onError: (error: any) => {
      showError('Lỗi xóa proxy', error.message)
    },
  })
}

// Perform health check on all proxies
export function useProxyHealthCheck() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-proxies?action=health-check', {
        body: {}
      })

      if (error) throw error
      return data.data
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['proxies'] })
      showSuccess(
        'Health check hoàn thành', 
        `Tested: ${result.summary.total_tested}, Active: ${result.summary.active}, Blocked: ${result.summary.blocked}`
      )
    },
    onError: (error: any) => {
      showError('Lỗi health check', error.message)
    },
  })
}

// Get proxy statistics
export function useProxyStats() {
  return useQuery({
    queryKey: ['proxy-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proxy_pool')
        .select('status, response_time, success_rate, cost_per_request')

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(proxy => proxy.status === 'active').length,
        blocked: data.filter(proxy => proxy.status === 'blocked').length,
        testing: data.filter(proxy => proxy.status === 'testing').length,
        avgResponseTime: data.reduce((sum, proxy) => sum + (proxy.response_time || 0), 0) / data.length,
        avgSuccessRate: data.reduce((sum, proxy) => sum + (proxy.success_rate || 0), 0) / data.length,
        totalCostPerRequest: data.reduce((sum, proxy) => sum + (proxy.cost_per_request || 0), 0)
      }

      return stats
    },
    refetchInterval: 30000,
  })
}