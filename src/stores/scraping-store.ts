import { create } from 'zustand'
import type { ScrapingJob } from '@/lib/supabase'

interface ScrapingState {
  activeJobs: ScrapingJob[]
  selectedJob: ScrapingJob | null
  realTimeUpdates: Record<string, Partial<ScrapingJob>>
  setActiveJobs: (jobs: ScrapingJob[]) => void
  setSelectedJob: (job: ScrapingJob | null) => void
  updateJobProgress: (jobId: string, updates: Partial<ScrapingJob>) => void
  addJob: (job: ScrapingJob) => void
  removeJob: (jobId: string) => void
  updateJobStatus: (jobId: string, status: ScrapingJob['status']) => void
}

export const useScrapingStore = create<ScrapingState>()((set, get) => ({
  activeJobs: [],
  selectedJob: null,
  realTimeUpdates: {},

  setActiveJobs: (jobs) => set({ activeJobs: jobs }),

  setSelectedJob: (job) => set({ selectedJob: job }),

  updateJobProgress: (jobId, updates) => {
    set((state) => ({
      activeJobs: state.activeJobs.map((job) =>
        job.job_id === jobId ? { ...job, ...updates } : job
      ),
      selectedJob:
        state.selectedJob?.job_id === jobId
          ? { ...state.selectedJob, ...updates }
          : state.selectedJob,
      realTimeUpdates: {
        ...state.realTimeUpdates,
        [jobId]: { ...state.realTimeUpdates[jobId], ...updates },
      },
    }))
  },

  addJob: (job) => {
    set((state) => ({
      activeJobs: [job, ...state.activeJobs],
    }))
  },

  removeJob: (jobId) => {
    set((state) => ({
      activeJobs: state.activeJobs.filter((job) => job.job_id !== jobId),
      selectedJob:
        state.selectedJob?.job_id === jobId ? null : state.selectedJob,
    }))
  },

  updateJobStatus: (jobId, status) => {
    const { updateJobProgress } = get()
    updateJobProgress(jobId, { status })
  },
}))