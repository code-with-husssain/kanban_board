import { create } from 'zustand'
import { authAPI } from '@/lib/api'

export interface User {
  _id: string
  name: string
  email: string
  role?: string
  companyId?: string
}

interface UserState {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    set({ loading: true })
    try {
      const response = await authAPI.getAllUsers()
      set({ users: response.data, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Failed to fetch users:', error)
    }
  },
}))

