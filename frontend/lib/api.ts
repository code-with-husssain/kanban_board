import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const authData = localStorage.getItem('auth-storage')
      if (authData) {
        try {
          const parsed = JSON.parse(authData)
          if (parsed.state?.token) {
            config.headers.Authorization = `Bearer ${parsed.state.token}`
          }
        } catch (error) {
          // Ignore parse errors
        }
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getAllUsers: () => api.get('/auth/users'),
}

// Board API
export const boardAPI = {
  getAll: () => api.get('/boards'),
  getById: (id: string) => api.get(`/boards/${id}`),
  create: (data: { name: string; description?: string; assignees?: string[] }) => 
    api.post('/boards', data),
  delete: (id: string) => api.delete(`/boards/${id}`),
}

// Task API
export const taskAPI = {
  getByBoardId: (boardId: string) => api.get(`/tasks/${boardId}`),
  create: (data: {
    title: string
    description?: string
    status?: string
    priority?: string
    assignee?: string
    boardId: string
  }) => api.post('/tasks', data),
  update: (id: string, data: {
    title?: string
    description?: string
    status?: string
    priority?: string
    assignee?: string
  }) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}

export default api



