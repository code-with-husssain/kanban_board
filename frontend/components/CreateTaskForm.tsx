'use client'

import { useState, useEffect } from 'react'
import { useBoardStore } from '@/store/boardStore'
import { useUserStore } from '@/store/userStore'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface CreateTaskFormProps {
  onClose: () => void
  initialStatus?: string
}

export default function CreateTaskForm({ onClose, initialStatus }: CreateTaskFormProps) {
  const { selectedBoard, createTask } = useBoardStore()
  const { users, fetchUsers } = useUserStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignee, setAssignee] = useState('unassigned')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  if (!selectedBoard) return null

  // Get sections from board, sorted by order
  const sections = selectedBoard.sections || []
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)
  const defaultStatus = initialStatus || (sortedSections.length > 0 ? sortedSections[0].id : 'todo')

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
        status: defaultStatus,
        priority,
        assignee: assignee === 'unassigned' ? undefined : assignee.trim(),
        boardId: selectedBoard._id,
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setAssignee('unassigned')
      onClose()
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
      <form onSubmit={handleSubmit} className="space-y-3">
          <Input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
          <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-2">
            <Select
            value={priority}
              onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
            <Select
            value={assignee}
              onValueChange={setAssignee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
            {availableUsers.map((user) => (
                  <SelectItem key={user._id} value={user.name}>
                {user.name}
                  </SelectItem>
            ))}
            {assignee && assignee !== 'unassigned' && !availableUsers.some(u => u.name === assignee) && (
                  <SelectItem value={assignee}>{assignee}</SelectItem>
            )}
              </SelectContent>
            </Select>
        </div>
        <div className="flex gap-2">
            <Button
            type="submit"
            disabled={loading}
              className="flex-1"
          >
            {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button
            type="button"
              variant="secondary"
              size="icon"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
            </Button>
        </div>
      </form>
      </CardContent>
    </Card>
  )
}



