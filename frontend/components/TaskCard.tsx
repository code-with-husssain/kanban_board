'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@/store/boardStore'
import { AlertCircle, Clock, GripVertical, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return 'border-l-foreground bg-muted'
      case 'medium':
        return 'border-l-muted-foreground/50 bg-muted/50'
      case 'low':
        return 'border-l-muted-foreground/30 bg-muted/30'
      default:
        return 'border-l-border bg-muted/30'
    }
  }

  const getPriorityIcon = () => {
    if (task.priority === 'high') {
      return <AlertCircle className="w-4 h-4 text-foreground" />
    }
    return null
  }

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => {
        return (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`border-l-4 ${getPriorityColor()} cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 select-none group ${
              snapshot.isDragging 
                ? 'shadow-2xl ring-4 ring-foreground/20 z-50 border-foreground cursor-grabbing' 
                : 'hover:shadow-md'
            }`}
            style={provided.draggableProps.style}
            onDoubleClick={(e) => {
              // Double click to open modal (doesn't interfere with drag)
              e.stopPropagation()
              onClick()
            }}
          >
            <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex items-start gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors pointer-events-none" />
                  <h3 className="font-semibold text-foreground flex-1">
                {task.title}
              </h3>
            </div>
            {getPriorityIcon()}
          </div>
          {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            {task.assignee && (
                  <Badge variant="secondary" className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                  {task.assignee}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }}
    </Draggable>
  )
}


