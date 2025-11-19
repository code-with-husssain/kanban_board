'use client'

import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import CreateTaskForm from './CreateTaskForm'
import { motion } from 'framer-motion'

interface ColumnProps {
  column: {
    id: string
    title: string
    status: 'todo' | 'in-progress' | 'done'
  }
  tasks: any[]
  onTaskClick: (taskId: string) => void
}

export default function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const getColumnColor = () => {
    switch (column.status) {
      case 'todo':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'in-progress':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'done':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className={`rounded-lg border-2 ${getColumnColor()} p-4 min-h-[600px] flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {column.title}
          </h2>
          <motion.span 
            key={tasks.length}
            initial={{ scale: 1.3, color: '#3b82f6' }}
            animate={{ scale: 1, color: undefined }}
            transition={{ duration: 0.3 }}
            className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full font-medium shadow-sm"
          >
            {tasks.length}
          </motion.span>
        </div>

        {column.status === 'todo' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-300 dark:border-gray-600"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}

        {showCreateForm && column.status === 'todo' && (
          <CreateTaskForm
            onClose={() => setShowCreateForm(false)}
            initialStatus={column.status}
          />
        )}

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => {
            const getDropZoneStyle = () => {
              if (snapshot.isDraggingOver) {
                switch (column.status) {
                  case 'todo':
                    return 'bg-blue-50 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-700'
                  case 'in-progress':
                    return 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-dashed border-yellow-400 dark:border-yellow-500 ring-2 ring-yellow-300 dark:ring-yellow-700'
                  case 'done':
                    return 'bg-green-50 dark:bg-green-900/30 border-2 border-dashed border-green-400 dark:border-green-500 ring-2 ring-green-300 dark:ring-green-700'
                  default:
                    return 'bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-400 dark:border-primary-500'
                }
              }
              return 'bg-transparent'
            }

            return (
              <motion.div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 transition-all duration-300 min-h-[200px] rounded-lg ${getDropZoneStyle()}`}
                animate={{
                  scale: snapshot.isDraggingOver ? 1.02 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
              >
                <div className="space-y-3">
                  {tasks.length === 0 && !snapshot.isDraggingOver && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span>Drop tasks here</span>
                      </div>
                    </motion.div>
                  )}
                  {snapshot.isDraggingOver && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-4 text-primary-600 dark:text-primary-400 font-medium text-sm"
                    >
                      ✨ Drop to move to {column.title}
                    </motion.div>
                  )}
                  {tasks.map((task, index) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      index={index}
                      onClick={() => onTaskClick(task._id)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              </motion.div>
            )
          }}
        </Droppable>
      </div>
    </div>
  )
}

