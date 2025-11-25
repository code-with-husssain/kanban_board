import { create } from 'zustand'
import { boardAPI, taskAPI } from '@/lib/api'
import toast from 'react-hot-toast'

export interface BoardSection {
  id: string
  name: string
  order: number
}

export interface Board {
  _id: string
  name: string
  description?: string
  userId?: string
  assignees?: string[]
  sections?: BoardSection[]
  createdAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high'
  assignee?: string
  userId?: string
  boardId: string
  createdAt: string
  updatedAt: string
}

interface BoardState {
  boards: Board[]
  selectedBoard: Board | null
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchBoards: () => Promise<void>
  selectBoard: (board: Board | null) => void
  createBoard: (name: string, description?: string, assignees?: string[]) => Promise<void>
  updateBoard: (id: string, updates: { name?: string; description?: string; assignees?: string[] }) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
  fetchTasks: (boardId: string) => Promise<void>
  createTask: (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (taskId: string, newStatus: string) => Promise<void>
  fetchBoardSections: (boardId: string) => Promise<void>
  addSection: (boardId: string, name: string) => Promise<void>
  updateSection: (boardId: string, sectionId: string, name: string) => Promise<void>
  deleteSection: (boardId: string, sectionId: string) => Promise<void>
  reorderSections: (boardId: string, sectionIds: string[]) => Promise<void>
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  selectedBoard: null,
  tasks: [],
  loading: false,
  error: null,

  fetchBoards: async () => {
    set({ loading: true, error: null })
    try {
      const response = await boardAPI.getAll()
      set({ boards: response.data, loading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch boards'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  selectBoard: (board: Board | null) => {
    set({ selectedBoard: board })
    if (board) {
      get().fetchTasks(board._id)
    } else {
      set({ tasks: [] })
    }
  },

  createBoard: async (name: string, description?: string, assignees?: string[]) => {
    try {
      const response = await boardAPI.create({ name, description, assignees })
      const newBoard = response.data
      set((state) => ({ boards: [newBoard, ...state.boards] }))
      toast.success('Board created successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create board'
      toast.error(errorMessage)
      throw error
    }
  },

  updateBoard: async (id: string, updates: { name?: string; description?: string; assignees?: string[] }) => {
    try {
      const response = await boardAPI.update(id, updates)
      const updatedBoard = response.data
      set((state) => ({
        boards: state.boards.map((b) => (b._id === id ? updatedBoard : b)),
        selectedBoard: state.selectedBoard?._id === id ? updatedBoard : state.selectedBoard,
      }))
      toast.success('Board updated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update board'
      toast.error(errorMessage)
      throw error
    }
  },

  deleteBoard: async (id: string) => {
    try {
      await boardAPI.delete(id)
      set((state) => ({
        boards: state.boards.filter((b) => b._id !== id),
        selectedBoard: state.selectedBoard?._id === id ? null : state.selectedBoard,
        tasks: state.selectedBoard?._id === id ? [] : state.tasks,
      }))
      toast.success('Board deleted successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete board'
      toast.error(errorMessage)
      throw error
    }
  },

  fetchTasks: async (boardId: string) => {
    set({ loading: true, error: null })
    try {
      const response = await taskAPI.getByBoardId(boardId)
      set({ tasks: response.data, loading: false })
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch tasks'
      set({ error: errorMessage, loading: false })
      toast.error(errorMessage)
    }
  },

  createTask: async (task) => {
    try {
      const response = await taskAPI.create(task)
      const newTask = response.data
      // Refresh tasks to show filtered view (tasks assigned to current user)
      const state = get()
      if (state.selectedBoard) {
        await get().fetchTasks(state.selectedBoard._id)
      } else {
        set((state) => ({ tasks: [newTask, ...state.tasks] }))
      }
      toast.success('Task created successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create task'
      toast.error(errorMessage)
      throw error
    }
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    try {
      const response = await taskAPI.update(id, updates)
      const updatedTask = response.data
      set((state) => ({
        tasks: state.tasks.map((t) => (t._id === id ? updatedTask : t)),
      }))
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update task'
      toast.error(errorMessage)
      throw error
    }
  },

  deleteTask: async (id: string) => {
    try {
      await taskAPI.delete(id)
      set((state) => ({
        tasks: state.tasks.filter((t) => t._id !== id),
      }))
      toast.success('Task deleted successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete task'
      toast.error(errorMessage)
      throw error
    }
  },

  moveTask: async (taskId: string, newStatus: string) => {
    const currentTask = get().tasks.find((t) => t._id === taskId)
    if (!currentTask) return

    // Optimistic update - update UI immediately for smooth UX
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      ),
    }))

    try {
      await get().updateTask(taskId, { status: newStatus })
      // Status successfully updated in backend
    } catch (error) {
      // Revert on error
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t._id === taskId ? currentTask : t
        ),
      }))
      // Error toast is already handled in updateTask
      throw error
    }
  },

  fetchBoardSections: async (boardId: string) => {
    try {
      const response = await boardAPI.getById(boardId)
      const board = response.data
      set((state) => ({
        boards: state.boards.map((b) => (b._id === boardId ? board : b)),
        selectedBoard: state.selectedBoard?._id === boardId ? board : state.selectedBoard,
      }))
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch board sections'
      toast.error(errorMessage)
      throw error
    }
  },

  addSection: async (boardId: string, name: string) => {
    try {
      const response = await boardAPI.addSection(boardId, name)
      const newSection = response.data
      // Refresh board to get updated sections
      await get().fetchBoardSections(boardId)
      toast.success('Section added successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to add section'
      toast.error(errorMessage)
      throw error
    }
  },

  updateSection: async (boardId: string, sectionId: string, name: string) => {
    try {
      await boardAPI.updateSection(boardId, sectionId, name)
      // Refresh board to get updated sections
      await get().fetchBoardSections(boardId)
      toast.success('Section updated successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to update section'
      toast.error(errorMessage)
      throw error
    }
  },

  deleteSection: async (boardId: string, sectionId: string) => {
    try {
      await boardAPI.deleteSection(boardId, sectionId)
      // Refresh board to get updated sections
      await get().fetchBoardSections(boardId)
      toast.success('Section deleted successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete section'
      toast.error(errorMessage)
      throw error
    }
  },

  reorderSections: async (boardId: string, sectionIds: string[]) => {
    try {
      await boardAPI.reorderSections(boardId, sectionIds)
      // Refresh board to get updated sections
      await get().fetchBoardSections(boardId)
      toast.success('Sections reordered successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reorder sections'
      toast.error(errorMessage)
      throw error
    }
  },
}))

