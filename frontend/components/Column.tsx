'use client'

import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import CreateTaskForm from './CreateTaskForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ColumnProps {
  column: {
    id: string
    title: string
    status: string
  }
  tasks: any[]
  onTaskClick: (taskId: string) => void
}

export default function Column({ column, tasks, onTaskClick }: ColumnProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const getColumnColor = () => {
    // Use a consistent color scheme based on section ID
    // Default sections get specific colors, custom sections get a default color
    if (column.status === 'todo') {
      return 'border-foreground/20 bg-muted/30'
    } else if (column.status === 'in-progress') {
      return 'border-foreground/30 bg-muted/40'
    } else if (column.status === 'testing') {
      return 'border-foreground/35 bg-muted/45'
    } else if (column.status === 'done') {
      return 'border-foreground/40 bg-muted/50'
    } else {
      // Custom sections get a default color
      return 'border-border bg-muted/20'
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Card className={`border-2 ${getColumnColor()} min-h-[600px] flex flex-col transition-all duration-300`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
            {column.title}
            </CardTitle>
            <Badge variant="secondary">
            {tasks.length}
            </Badge>
        </div>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
        <Button
          variant="outline"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="mb-4 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </Button>

        {showCreateForm && (
          <CreateTaskForm
            onClose={() => setShowCreateForm(false)}
            initialStatus={column.status}
          />
        )}

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => {
            const getDropZoneStyle = () => {
              if (snapshot.isDraggingOver) {
                return 'bg-muted/50 border-2 border-dashed border-foreground/30 ring-2 ring-foreground/10'
              }
              return 'bg-transparent'
            }

            return (
                <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                  className={`flex-1 transition-all duration-300 min-h-[200px] rounded-lg ${getDropZoneStyle()} ${
                    snapshot.isDraggingOver ? 'scale-[1.02]' : ''
                  }`}
              >
                <div className="space-y-3">
                  {tasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                      <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <span>Drop tasks here</span>
                      </div>
                      </div>
                  )}
                  {snapshot.isDraggingOver && (
                      <div className="text-center py-4 text-foreground font-medium text-sm">
                      ✨ Drop to move to {column.title}
                      </div>
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
                </div>
            )
          }}
        </Droppable>
        </CardContent>
      </Card>
    </div>
  )
}

