import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export interface Company {
  _id: string
  name: string
}

export interface User {
  _id: string
  name: string
  email: string
  role?: string
  companyId?: string
}

interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, companyName?: string, companyId?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ loading: true })
        try {
          const response = await authAPI.login({ email, password })
          set({
            user: response.data.user,
            company: response.data.company || null,
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

      register: async (name: string, email: string, password: string, companyName?: string, companyId?: string) => {
        set({ loading: true })
        try {
          await authAPI.register({ name, email, password, companyName, companyId })
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
          company: null,
          token: null,
          isAuthenticated: false,
        })
        toast.success('Logged out successfully!')
      },

      checkAuth: async () => {
        set({ loading: true })
        const { token, user, company } = get()
        
        // First, check if token exists in localStorage directly (bypassing Zustand state)
        // This handles cases where Zustand persist hasn't synced yet after login
        let tokenFromStorage: string | null = null
        let userFromStorage: User | null = null
        let companyFromStorage: Company | null = null
        
        if (typeof window !== 'undefined') {
          try {
            const authData = localStorage.getItem('auth-storage')
            if (authData) {
              const parsed = JSON.parse(authData)
              tokenFromStorage = parsed?.state?.token || null
              userFromStorage = parsed?.state?.user || null
              companyFromStorage = parsed?.state?.company || null
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
        
        // Use token from storage if Zustand state doesn't have it yet
        const effectiveToken = token || tokenFromStorage
        const effectiveUser = user || userFromStorage
        const effectiveCompany = company || companyFromStorage
        
        if (!effectiveToken) {
          set({ isAuthenticated: false, user: null, token: null, loading: false })
          return
        }

        // If we have a token (from state or storage), set authenticated optimistically
        // This prevents the brief "unauthenticated" state that triggers redirect
        // This is critical for production where state sync timing can cause issues
        if (effectiveToken && effectiveUser) {
          set({ 
            isAuthenticated: true, 
            token: effectiveToken,
            user: effectiveUser,
            company: effectiveCompany,
            loading: false 
          })
        } else if (effectiveToken) {
          // We have a token but no user - still set authenticated to prevent redirect
          // The API call will populate the user data
          set({ 
            isAuthenticated: true, 
            token: effectiveToken,
            company: effectiveCompany,
            loading: false 
          })
        }

        try {
          const response = await authAPI.getMe()
          set({
            user: response.data.user,
            company: response.data.company || null,
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
            // Also clear from localStorage on 401
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth-storage')
            }
          } else {
            // For other errors (network, CORS, etc.), keep the existing auth state
            // This prevents redirect loops when API is temporarily unavailable
            // The optimistic auth state set above will keep user logged in
            set({ loading: false })
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user, company: state.company }),
    }
  )
)

