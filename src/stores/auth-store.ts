import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
  checkAdminStatus: () => void
}

export const useAuthStore = create<AuthState>()((
  persist(
    (set, get) => ({
      user: null,
      loading: true,
      isAdmin: false,

      setUser: (user) => {
        set({ user })
        if (user) {
          get().checkAdminStatus()
        } else {
          set({ isAdmin: false })
        }
      },

      setLoading: (loading) => set({ loading }),

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, isAdmin: false })
      },

      checkAdminStatus: async () => {
        const { user } = get()
        if (!user) {
          set({ isAdmin: false })
          return
        }

        try {
          const { data } = await supabase
            .from('admin_users')
            .select('role, is_active')
            .eq('email', user.email)
            .eq('is_active', true)
            .maybeSingle()

          set({ isAdmin: !!data })
        } catch (error) {
          console.error('Error checking admin status:', error)
          set({ isAdmin: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
))