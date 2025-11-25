'use client'

import { useEffect, useState } from 'react'
import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { boardAPI } from '@/lib/api'
import Column from './Column'
import TaskModal from './TaskModal'
import SectionManager from './SectionManager'
import LoadingSkeleton from './LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface KanbanBoardProps {
  boardId: string
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
  const { tasks, loading, fetchTasks, moveTask, selectedBoard, selectBoard } = useBoardStore()
  const { user } = useAuthStore()
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showSectionManager, setShowSectionManager] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [boardLoading, setBoardLoading] = useState(true)
  
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    setIsMounted(true)
    fetchTasks(boardId)
    
    // Fetch board details to get sections
    const fetchBoard = async () => {
      try {
        setBoardLoading(true)
        const response = await boardAPI.getById(boardId)
        selectBoard(response.data)
      } catch (error) {
        console.error('Failed to fetch board:', error)
      } finally {
        setBoardLoading(false)
      }
    }
    fetchBoard()
  }, [boardId, fetchTasks, selectBoard])

  // Refresh board when section manager closes (in case sections were added/updated)
  useEffect(() => {
    if (!showSectionManager && boardId) {
      const refreshBoard = async () => {
        try {
          const response = await boardAPI.getById(boardId)
          selectBoard(response.data)
          // Also refresh tasks in case section changes affected them
          fetchTasks(boardId)
        } catch (error) {
          console.error('Failed to refresh board:', error)
        }
      }
      // Small delay to ensure backend has processed the changes
      const timeoutId = setTimeout(refreshBoard, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [showSectionManager, boardId, selectBoard, fetchTasks])

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

    // Get the new status from the destination column (section ID)
    const newStatus = destination.droppableId
    
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

  // Get sections from board, sorted by order
  const sections = selectedBoard?.sections || []
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  // Map sections to column format
  const columns = sortedSections.map((section) => ({
    id: section.id,
    title: section.name,
    status: section.id,
  }))

  if (loading || boardLoading || !isMounted) {
    return <LoadingSkeleton />
  }

  return (
    <>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowSectionManager(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage Sections
          </Button>
        </div>
      )}

      {columns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No sections found.</p>
          <p>Please add sections to this board to get started.</p>
          {isAdmin && (
            <p className="mt-4 text-sm">Click "Manage Sections" above to add your first section.</p>
          )}
        </div>
      ) : (

        <DragDropContext 
          onDragStart={onDragStart} 
          onDragUpdate={onDragUpdate}
          onDragEnd={onDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
      )}

      {showTaskModal && selectedTask && (
        <TaskModal
          taskId={selectedTask}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
        />
      )}

      {showSectionManager && (
        <SectionManager
          boardId={boardId}
          open={showSectionManager}
          onClose={() => setShowSectionManager(false)}
        />
      )}
    </>
  )
}

