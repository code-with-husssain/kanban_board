'use client'

import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { Trash2, Pencil } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function BoardList() {
  const { boards, selectBoard, deleteBoard, updateBoard } = useBoardStore()
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUserStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingBoard, setEditingBoard] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAssignees, setEditAssignees] = useState<string[]>([])
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (editingBoard) {
      fetchUsers()
      const board = boards.find((b) => b._id === editingBoard)
      if (board) {
        setEditName(board.name)
        setEditDescription(board.description || '')
        setEditAssignees(board.assignees || [])
      }
    }
  }, [editingBoard, boards, fetchUsers])

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

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBoard(id)
  }

  const handleUpdateBoard = async () => {
    if (!editingBoard || !editName.trim()) return
    
    setUpdating(true)
    try {
      await updateBoard(editingBoard, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        assignees: editAssignees,
      })
      setEditingBoard(null)
      setEditName('')
      setEditDescription('')
      setEditAssignees([])
    } catch (error) {
      // Error handled by toast
    } finally {
      setUpdating(false)
    }
  }

  const toggleAssignee = (userName: string) => {
    setEditAssignees(prev =>
      prev.includes(userName)
        ? prev.filter(name => name !== userName)
        : [...prev, userName]
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-foreground mb-8">
        Your Boards
      </h2>

      {boards.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg mb-4">
            No boards yet. Create your first board to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card
              key={board._id}
              onClick={() => selectBoard(board)}
              className="cursor-pointer hover:shadow-lg transition-shadow relative group"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">
                  {board.name}
                  </CardTitle>
                {user && board.userId === user._id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(board._id, e)}
                      className="h-8 w-8 hover:bg-accent"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(board._id, e)}
                      disabled={deletingId === board._id}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              {board.description && (
                  <CardDescription className="line-clamp-2">
                  {board.description}
                  </CardDescription>
              )}
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                Created {new Date(board.createdAt).toLocaleDateString()}
              </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editingBoard && (
        <Dialog open={true} onOpenChange={() => setEditingBoard(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Board</DialogTitle>
              <DialogDescription>
                Update the board name, description, and assignees.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Board Name</Label>
                <Input
                  id="edit-name"
                  type="text"
                  placeholder="Board name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUpdateBoard()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Description (optional)"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to Users (optional)</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  ) : (
                    users.map((u) => (
                      <label
                        key={u._id}
                        className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={editAssignees.includes(u.name)}
                          onCheckedChange={() => toggleAssignee(u.name)}
                        />
                        <span className="text-sm text-foreground">{u.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingBoard(null)
                  setEditName('')
                  setEditDescription('')
                  setEditAssignees([])
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateBoard}
                disabled={updating || !editName.trim()}
              >
                {updating ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}



