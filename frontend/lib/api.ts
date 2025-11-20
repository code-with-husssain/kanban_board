import axios from 'axios'

// Use relative URL in production (same domain) or absolute URL in development
// This ensures API calls work both locally and on Vercel
const getAPIUrl = () => {
  // Check if we have an explicit API URL set (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }
  
  // In browser, check if we're on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api'
    }
    // In production (Vercel or any other domain), use relative URL since API is on same domain
    return '/api'
  }
  
  // Server-side: use environment variable or default to relative URL
  // This is safe because Vercel routes /api/* to backend
  return process.env.NEXT_PUBLIC_API_URL || '/api'
}

// Create axios instance with dynamic baseURL
const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
})

// Set baseURL dynamically and add token to requests
api.interceptors.request.use(
  (config) => {
    // Set baseURL dynamically based on current environment
    config.baseURL = getAPIUrl()
    
    // Add auth token if available
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
        const currentPath = window.location.pathname
        // Only redirect if not already on login page to prevent redirect loops
        if (currentPath !== '/login') {
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
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

// Admin API - requires admin secret in header
export const adminAPI = {
  verifySecret: (adminSecret: string) => 
    api.post('/admin/verify-secret', { adminSecret }),
  getAllUsers: (adminSecret: string) => 
    api.get('/admin/users', { 
      headers: { 'x-admin-secret': adminSecret } 
    }),
  setAdmin: (userId: string, adminSecret: string) => 
    api.post(`/admin/set-admin/${userId}`, {}, { 
      headers: { 'x-admin-secret': adminSecret } 
    }),
  removeAdmin: (userId: string, adminSecret: string) => 
    api.post(`/admin/remove-admin/${userId}`, {}, { 
      headers: { 'x-admin-secret': adminSecret } 
    }),
}

export default api



