import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Company, SearchFilters, PaginationParams } from '@/types'
import { useNotification } from '@/hooks/use-notification'

interface CompaniesQueryParams extends PaginationParams {
  filters?: SearchFilters
}

// Get companies with pagination and filters
export function useCompanies({ page = 1, pageSize = 20, filters }: CompaniesQueryParams = {}) {
  return useQuery({
    queryKey: ['companies', page, pageSize, filters],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters?.province) {
        query = query.eq('province', filters.province)
      }
      if (filters?.industryCode) {
        query = query.eq('industry_code', filters.industryCode)
      }
      if (filters?.businessStatus) {
        query = query.eq('business_status', filters.businessStatus)
      }
      if (filters?.keyword) {
        query = query.or(`company_name.ilike.%${filters.keyword}%,tax_code.ilike.%${filters.keyword}%`)
      }
      if (filters?.establishmentDateFrom) {
        query = query.gte('establishment_date', filters.establishmentDateFrom)
      }
      if (filters?.establishmentDateTo) {
        query = query.lte('establishment_date', filters.establishmentDateTo)
      }
      if (filters?.charterCapitalFrom) {
        query = query.gte('charter_capital', filters.charterCapitalFrom)
      }
      if (filters?.charterCapitalTo) {
        query = query.lte('charter_capital', filters.charterCapitalTo)
      }

      // Apply pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        companies: data as Company[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      }
    },
    keepPreviousData: true,
  })
}

// Get single company
export function useCompany(taxCode: string) {
  return useQuery({
    queryKey: ['company', taxCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('tax_code', taxCode)
        .maybeSingle()

      if (error) throw error
      return data as Company | null
    },
    enabled: !!taxCode,
  })
}

// Get companies statistics
export function useCompaniesStats() {
  return useQuery({
    queryKey: ['companies-stats'],
    queryFn: async () => {
      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError

      // Get by province
      const { data: provinceData, error: provinceError } = await supabase
        .from('companies')
        .select('province')
        .not('province', 'is', null)

      if (provinceError) throw provinceError

      // Get by industry
      const { data: industryData, error: industryError } = await supabase
        .from('companies')
        .select('industry_code, industry_name')
        .not('industry_code', 'is', null)

      if (industryError) throw industryError

      // Get by business status
      const { data: statusData, error: statusError } = await supabase
        .from('companies')
        .select('business_status')
        .not('business_status', 'is', null)

      if (statusError) throw statusError

      // Process province stats
      const provinceStats = provinceData.reduce((acc: Record<string, number>, company) => {
        const province = company.province
        acc[province] = (acc[province] || 0) + 1
        return acc
      }, {})

      const companiesByProvince = Object.entries(provinceStats)
        .map(([province, count]) => ({ province, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Process industry stats
      const industryStats = industryData.reduce((acc: Record<string, { count: number; name: string }>, company) => {
        const code = company.industry_code
        if (!acc[code]) {
          acc[code] = { count: 0, name: company.industry_name || code }
        }
        acc[code].count += 1
        return acc
      }, {})

      const companiesByIndustry = Object.entries(industryStats)
        .map(([code, { count, name }]) => ({ code, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Process status stats
      const statusStats = statusData.reduce((acc: Record<string, number>, company) => {
        const status = company.business_status
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})

      const companiesByStatus = Object.entries(statusStats)
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count)

      return {
        totalCompanies: totalCount || 0,
        companiesByProvince,
        companiesByIndustry,
        companiesByStatus
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Export companies
export function useExportCompanies() {
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async ({ filters, format, fields }: {
      filters?: SearchFilters
      format: 'csv' | 'excel' | 'json'
      fields: string[]
    }) => {
      const { data, error } = await supabase.functions.invoke('export-data', {
        body: {
          table: 'companies',
          filters,
          format,
          fields
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      showSuccess('Xuất dữ liệu thành công', 'File sẽ được tải xuống trong giây lát')
    },
    onError: (error: any) => {
      showError('Lỗi xuất dữ liệu', error.message)
    },
  })
}

// Delete companies
export function useDeleteCompanies() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (taxCodes: string[]) => {
      const { error } = await supabase
        .from('companies')
        .delete()
        .in('tax_code', taxCodes)

      if (error) throw error
    },
    onSuccess: (_, taxCodes) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['companies-stats'] })
      showSuccess('Xóa dữ liệu thành công', `Đã xóa ${taxCodes.length} công ty`)
    },
    onError: (error: any) => {
      showError('Lỗi xóa dữ liệu', error.message)
    },
  })
}