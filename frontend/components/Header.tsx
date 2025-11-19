'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useTheme } from './ThemeProvider'
import { Moon, Sun, ArrowLeft, Plus, LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Header() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { selectedBoard, selectBoard, createBoard } = useBoardStore()
  const { user, logout } = useAuthStore()
  const { users, fetchUsers } = useUserStore()
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDescription, setBoardDescription] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showCreateBoard) {
      fetchUsers()
    }
  }, [showCreateBoard, fetchUsers])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return
    try {
      await createBoard(boardName, boardDescription, selectedAssignees)
      setBoardName('')
      setBoardDescription('')
      setSelectedAssignees([])
      setShowCreateBoard(false)
    } catch (error) {
      // Error handled by toast
    }
  }

  const toggleAssignee = (userName: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userName)
        ? prev.filter(name => name !== userName)
        : [...prev, userName]
    )
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedBoard && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => selectBoard(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedBoard ? selectedBoard.name : 'Kanban Board'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!selectedBoard && user?.role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateBoard(!showCreateBoard)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Board
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>

            {user && (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </motion.button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {showCreateBoard && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <input
              type="text"
              placeholder="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="w-full px-4 py-2 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
            />
            <textarea
              placeholder="Description (optional)"
              value={boardDescription}
              onChange={(e) => setBoardDescription(e.target.value)}
              className="w-full px-4 py-2 mb-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
            />
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign to Users (optional)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-800">
                {users.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(u.name)}
                        onChange={() => toggleAssignee(u.name)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{u.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateBoard}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateBoard(false)
                  setBoardName('')
                  setBoardDescription('')
                  setSelectedAssignees([])
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  )
}

