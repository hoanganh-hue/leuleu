import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ScrapingJob, JobParameters } from '@/types'
import { useNotification } from '@/hooks/use-notification'

// Get all jobs
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ScrapingJob[]
    },
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  })
}

// Get single job
export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle()

      if (error) throw error
      return data as ScrapingJob | null
    },
    enabled: !!jobId,
    refetchInterval: 2000, // Faster refresh for individual job
  })
}

// Create new scraping job
export function useCreateJob() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (params: { jobType: string; parameters: JobParameters; userId?: string }) => {
      const { data, error } = await supabase.functions.invoke('scrape-companies', {
        body: params
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      showSuccess('Job đã được tạo thành công', `Job ID: ${data.data.jobId}`)
    },
    onError: (error: any) => {
      showError('Lỗi tạo job', error.message)
    },
  })
}

// Update job status
export function useUpdateJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: Partial<ScrapingJob> }) => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .update(updates)
        .eq('job_id', jobId)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] })
    },
  })
}

// Cancel job
export function useCancelJob() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .update({ status: 'cancelled' })
        .eq('job_id', jobId)
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      showSuccess('Job đã được hủy thành công')
    },
    onError: (error: any) => {
      showError('Lỗi hủy job', error.message)
    },
  })
}

// Get job statistics
export function useJobStats() {
  return useQuery({
    queryKey: ['job-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('status')

      if (error) throw error

      const stats = {
        total: data.length,
        pending: data.filter(job => job.status === 'pending').length,
        running: data.filter(job => job.status === 'running').length,
        completed: data.filter(job => job.status === 'completed').length,
        failed: data.filter(job => job.status === 'failed').length,
      }

      return stats
    },
    refetchInterval: 10000,
  })
}