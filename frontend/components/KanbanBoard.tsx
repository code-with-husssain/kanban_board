'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useBoardStore } from '@/store/boardStore'
import Column from './Column'
import TaskModal from './TaskModal'
import LoadingSkeleton from './LoadingSkeleton'

interface KanbanBoardProps {
  boardId: string
}

const columns = [
  { id: 'todo', title: 'To Do', status: 'todo' as const },
  { id: 'in-progress', title: 'In Progress', status: 'in-progress' as const },
  { id: 'done', title: 'Done', status: 'done' as const },
]

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { tasks, loading, fetchTasks, moveTask } = useBoardStore()
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    fetchTasks(boardId)
  }, [boardId, fetchTasks])

  const onDragEnd = async (result: DropResult) => {
    // Reset cursor and styles
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    const { destination, source, draggableId } = result

    // If dropped outside a droppable area, do nothing
    if (!destination) {
      return
    }

    // If dropped in the same position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    // Get the new status from the destination column
    const newStatus = destination.droppableId as 'todo' | 'in-progress' | 'done'
    
    // Find the task to get its current status
    const task = tasks.find(t => t._id === draggableId)
    
    // Only update if status actually changed
    if (task && task.status !== newStatus) {
      try {
        await moveTask(draggableId, newStatus)
        // Status update is handled by the moveTask function which calls updateTask
        // The task status will be automatically updated in the backend
      } catch (error) {
        // Error handled by toast and optimistic update reverted
      }
    }
  }

  const onDragStart = (start: any) => {
    // Disable body scroll and text selection during drag for better UX
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    
    // Add a subtle vibration if supported (mobile)
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  const onDragUpdate = (update: any) => {
    // Add visual feedback during drag
    // The columns and cards will handle their own visual feedback
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  if (loading || !isMounted) {
    return <LoadingSkeleton />
  }

  return (
    <>
      <DragDropContext 
        onDragStart={onDragStart} 
        onDragUpdate={onDragUpdate}
        onDragEnd={onDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <Column
              key={column.id}
                column={column}
                tasks={getTasksByStatus(column.status)}
                onTaskClick={(taskId) => {
                  setSelectedTask(taskId)
                  setShowTaskModal(true)
                }}
              />
          ))}
        </div>
      </DragDropContext>

      {showTaskModal && selectedTask && (
        <TaskModal
          taskId={selectedTask}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </>
  )
}

