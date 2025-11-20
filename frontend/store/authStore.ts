import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export interface User {
  _id: string
  name: string
  email: string
  role?: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const response = await authAPI.login({ email, password })
          set({
            user: response.data.user,
            token: response.data.token,
            isAuthenticated: true,
            loading: false,
          })
          toast.success('Logged in successfully!')
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed'
          set({ loading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ loading: true })
        try {
          await authAPI.register({ name, email, password })
          set({ loading: false })
          toast.success('Account created successfully! Please sign in.')
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Registration failed'
          set({ loading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        toast.success('Logged out successfully!')
      },

      checkAuth: async () => {
        set({ loading: true })
        const { token, user } = get()
        if (!token) {
          set({ isAuthenticated: false, user: null, loading: false })
          return
        }

        // If we have a token and user in storage, consider authenticated initially
        // This prevents clearing auth on network errors and allows page to render
        if (token && user) {
          set({ isAuthenticated: true, loading: false })
        }

        try {
          const response = await authAPI.getMe()
          set({
            user: response.data.user,
            isAuthenticated: true,
            loading: false,
          })
        } catch (error: any) {
          // Only clear auth on 401 (unauthorized), not on network errors
          if (error.response?.status === 401) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            })
          } else {
            // For other errors (network, CORS, etc.), keep the existing auth state
            // This prevents redirect loops when API is temporarily unavailable
            set({ loading: false })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

