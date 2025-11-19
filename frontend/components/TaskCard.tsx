'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@/store/boardStore'
import { AlertCircle, Clock, GripVertical, User } from 'lucide-react'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <AlertCircle className="w-4 h-4 text-green-500" />
      default:
        return null
    }
  }

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => {
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`border-l-4 ${getPriorityColor()} bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 select-none group ${
              snapshot.isDragging 
                ? 'shadow-2xl ring-4 ring-primary-500/50 z-50 border-primary-500 cursor-grabbing' 
                : 'hover:shadow-md'
            }`}
            style={provided.draggableProps.style}
            onDoubleClick={(e) => {
              // Double click to open modal (doesn't interfere with drag)
              e.stopPropagation()
              onClick()
            }}
          >
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex items-start gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors pointer-events-none" />
              <h3 className="font-semibold text-gray-900 dark:text-white flex-1">
                {task.title}
              </h3>
            </div>
            {getPriorityIcon()}
          </div>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            {task.assignee && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-md">
                <User className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                <span className="text-primary-700 dark:text-primary-300 font-medium">
                  {task.assignee}
                </span>
              </div>
            )}
          </div>
        </div>
        )
      }}
    </Draggable>
  )
}


