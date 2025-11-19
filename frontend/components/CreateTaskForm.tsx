'use client'

import { useState, useEffect } from 'react'
import { useBoardStore } from '@/store/boardStore'
import { useUserStore } from '@/store/userStore'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

interface CreateTaskFormProps {
  onClose: () => void
  initialStatus?: 'todo' | 'in-progress' | 'done'
}

export default function CreateTaskForm({ onClose, initialStatus = 'todo' }: CreateTaskFormProps) {
  const { selectedBoard, createTask } = useBoardStore()
  const { users, fetchUsers } = useUserStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignee, setAssignee] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (!selectedBoard) return null

  // Filter users to only show those assigned to this board
  const boardAssignees = selectedBoard.assignees || []
  const availableUsers = boardAssignees.length > 0
    ? users.filter(user => boardAssignees.includes(user.name))
    : users // If no assignees specified, show all users (for backward compatibility)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await createTask({
        title,
        description,
        status: initialStatus,
        priority,
        assignee: assignee.trim() || undefined,
        boardId: selectedBoard._id,
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setAssignee('')
      onClose()
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-gray-900 dark:text-white"
          rows={3}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
          >
            <option value="">Unassigned</option>
            {availableUsers.map((user) => (
              <option key={user._id} value={user.name}>
                {user.name}
              </option>
            ))}
            {assignee && assignee !== '' && !availableUsers.some(u => u.name === assignee) && (
              <option value={assignee}>{assignee}</option>
            )}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  )
}



