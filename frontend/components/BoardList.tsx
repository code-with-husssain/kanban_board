'use client'

import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'
import { Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function BoardList() {
  const { boards, selectBoard, deleteBoard } = useBoardStore()
  const { user } = useAuthStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this board? All tasks will be deleted.')) {
      return
    }
    setDeletingId(id)
    try {
      await deleteBoard(id)
    } catch (error) {
      // Error handled by toast
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Your Boards
      </h2>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
            No boards yet. Create your first board to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board, index) => (
            <motion.div
              key={board._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectBoard(board)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow relative group"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {board.name}
                </h3>
                {user && board.userId === user._id && (
                  <button
                    onClick={(e) => handleDelete(board._id, e)}
                    disabled={deletingId === board._id}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
              {board.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {board.description}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}



