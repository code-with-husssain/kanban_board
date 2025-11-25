'use client'

import { useEffect, useState } from 'react'
import { useBoardStore, Task } from '@/store/boardStore'
import { useUserStore } from '@/store/userStore'
import { taskAPI } from '@/lib/api'
import { Save, Clock, User, ArrowRight } from 'lucide-react'
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
  const { tasks, updateTask, selectedBoard } = useBoardStore()
  const { users, fetchUsers } = useUserStore()
  const task = tasks.find((t) => t._id === taskId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<string>('todo')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [assignee, setAssignee] = useState('unassigned')
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Get sections from board, sorted by order
  const sections = selectedBoard?.sections || []
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

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

  useEffect(() => {
    const fetchActivities = async () => {
      if (!taskId) return
      setLoadingActivities(true)
      try {
        const response = await taskAPI.getActivity(taskId)
        setActivities(response.data || [])
      } catch (error) {
        console.error('Failed to fetch activities:', error)
        setActivities([])
      } finally {
        setLoadingActivities(false)
      }
    }
    fetchActivities()
  }, [taskId])

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
      // Refresh activities after update
      try {
        const response = await taskAPI.getActivity(taskId)
        setActivities(response.data || [])
      } catch (error) {
        console.error('Failed to refresh activities:', error)
      }
      onClose()
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
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
                onValueChange={(value) => setStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
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

        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Activity</Label>
            <p className="text-sm text-muted-foreground mb-3">History of changes made to this task</p>
          </div>
          
          {loadingActivities ? (
            <div className="text-sm text-muted-foreground">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {activities.map((activity) => {
                const formatActivity = () => {
                  const userName = activity.userName || 'Unknown'
                  const time = new Date(activity.createdAt).toLocaleString()
                  
                  switch (activity.action) {
                    case 'created':
                      return (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">{userName}</span> created this task
                            <div className="text-xs text-muted-foreground mt-0.5">{time}</div>
                          </div>
                        </div>
                      )
                    case 'updated':
                      const fieldLabels: { [key: string]: string } = {
                        title: 'Title',
                        description: 'Description',
                        priority: 'Priority',
                        assignee: 'Assignee'
                      }
                      return (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">{userName}</span> updated {fieldLabels[activity.field] || activity.field}
                            {activity.oldValue && activity.newValue && (
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="line-through text-muted-foreground">{activity.oldValue}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{activity.newValue}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-0.5">{time}</div>
                          </div>
                        </div>
                      )
                    case 'moved':
                      return (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">{userName}</span> moved this task
                            {activity.oldValue && activity.newValue && (
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="line-through text-muted-foreground">{activity.oldValue}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="font-medium">{activity.newValue}</span>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-0.5">{time}</div>
                          </div>
                        </div>
                      )
                    case 'deleted':
                      return (
                        <div className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium">{userName}</span> deleted this task
                            <div className="text-xs text-muted-foreground mt-0.5">{time}</div>
                          </div>
                        </div>
                      )
                    default:
                      return null
                  }
                }
                
                return (
                  <div key={activity._id} className="pb-2 border-b last:border-0">
                    {formatActivity()}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}



