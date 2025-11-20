'use client'

import { useEffect, useState } from 'react'
import { useBoardStore, Task } from '@/store/boardStore'
import { useUserStore } from '@/store/userStore'
import { Trash2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Separator } from '@/components/ui/separator'

interface TaskModalProps {
  taskId: string
  onClose: () => void
}

export default function TaskModal({ taskId, onClose }: TaskModalProps) {
  const { tasks, updateTask, deleteTask, selectedBoard } = useBoardStore()
  const { users, fetchUsers } = useUserStore()
  const task = tasks.find((t) => t._id === taskId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignee, setAssignee] = useState('unassigned')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filter users to only show those assigned to this board
  const boardAssignees = selectedBoard?.assignees || []
  const availableUsers = boardAssignees.length > 0
    ? users.filter(user => boardAssignees.includes(user.name))
    : users // If no assignees specified, show all users (for backward compatibility)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setPriority(task.priority)
      setAssignee(task.assignee || 'unassigned')
    }
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      await updateTask(taskId, {
        title,
        description,
        status,
        priority,
        assignee: assignee === 'unassigned' ? undefined : assignee.trim(),
      })
      onClose()
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await deleteTask(taskId)
      onClose()
    } catch (error) {
      // Error handled by toast
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details below
          </DialogDescription>
        </DialogHeader>

            <div className="space-y-4">
              <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
              <Label htmlFor="status">Status</Label>
              <Select
                    value={status}
                onValueChange={(value) => setStatus(value as 'todo' | 'in-progress' | 'done')}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
                </div>

                <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                    value={priority}
                onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
                </div>
              </div>

              <div>
            <Label htmlFor="assignee">Assignee</Label>
            <Select
                  value={assignee}
              onValueChange={setAssignee}
            >
              <SelectTrigger id="assignee">
                <SelectValue placeholder="Unassigned" />
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

              <div className="text-sm text-muted-foreground">
                <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
              </div>
            </div>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="destructive"
                onClick={handleDelete}
            className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
          </Button>
              <div className="flex gap-2">
            <Button
              variant="secondary"
                  onClick={onClose}
                >
                  Cancel
            </Button>
            <Button
                  onClick={handleSave}
                  disabled={loading || !title.trim()}
              className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



