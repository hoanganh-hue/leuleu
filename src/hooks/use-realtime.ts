import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useScrapingStore } from '@/stores/scraping-store'
import { useAppStore } from '@/stores/app-store'
import type { RealtimeUpdate } from '@/types'

export function useRealtime() {
  const { updateJobProgress } = useScrapingStore()
  const { addNotification } = useAppStore()

  useEffect(() => {
    // Subscribe to scraping_jobs updates
    const jobsSubscription = supabase
      .channel('scraping_jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_jobs',
        },
        (payload: RealtimeUpdate) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const job = payload.new
            updateJobProgress(job.job_id, {
              status: job.status,
              progress: job.progress,
              total_records: job.total_records,
              success_count: job.success_count,
              captcha_solved: job.captcha_solved,
              cost_tracking: job.cost_tracking,
            })

            // Show notification for status changes
            if (payload.old?.status !== job.status) {
              const statusMessages = {
                running: 'Job đã bắt đầu chạy',
                completed: 'Job đã hoàn thành thành công',
                failed: 'Job đã thất bại',
                paused: 'Job đã được tạm dừng',
              }

              const message = statusMessages[job.status as keyof typeof statusMessages]
              if (message) {
                addNotification({
                  type: job.status === 'completed' ? 'success' : 
                        job.status === 'failed' ? 'error' : 'info',
                  title: 'Cập nhật trạng thái Job',
                  message: `${message}: ${job.job_id.slice(0, 8)}...`,
                })
              }
            }
          }

          if (payload.eventType === 'INSERT' && payload.new) {
            addNotification({
              type: 'info',
              title: 'Job mới',
              message: 'Một job scraping mới đã được tạo',
            })
          }
        }
      )
      .subscribe()

    // Subscribe to proxy_pool updates for health monitoring
    const proxySubscription = supabase
      .channel('proxy_pool')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proxy_pool',
        },
        (payload: RealtimeUpdate) => {
          if (payload.new?.status === 'blocked' && payload.old?.status !== 'blocked') {
            addNotification({
              type: 'warning',
              title: 'Proxy bị block',
              message: `Proxy ${payload.new.proxy_url} đã bị block`,
            })
          }
        }
      )
      .subscribe()

    return () => {
      jobsSubscription.unsubscribe()
      proxySubscription.unsubscribe()
    }
  }, [])
}

export default useRealtime