'use client'

import { useState, useEffect } from 'react'
import { useBoardStore, BoardSection } from '@/store/boardStore'
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

interface SectionManagerProps {
  boardId: string
  open: boolean
  onClose: () => void
}

export default function SectionManager({ boardId, open, onClose }: SectionManagerProps) {
  const { selectedBoard, addSection, updateSection, deleteSection, fetchBoardSections } = useBoardStore()
  const [newSectionName, setNewSectionName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && boardId) {
      fetchBoardSections(boardId)
    }
  }, [open, boardId, fetchBoardSections])

  const sections = selectedBoard?.sections || []
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Section name is required')
      return
    }

    setLoading(true)
    try {
      await addSection(boardId, newSectionName.trim())
      setNewSectionName('')
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (section: BoardSection) => {
    setEditingId(section.id)
    setEditingName(section.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleSaveEdit = async (sectionId: string) => {
    if (!editingName.trim()) {
      toast.error('Section name is required')
      return
    }

    setLoading(true)
    try {
      await updateSection(boardId, sectionId, editingName.trim())
      setEditingId(null)
      setEditingName('')
    } catch (error) {
      // Error handled by toast
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sectionId: string, sectionName: string) => {
    if (!confirm(`Are you sure you want to delete the section "${sectionName}"?`)) {
      return
    }

    setLoading(true)
    try {
      await deleteSection(boardId, sectionId)
    } catch (error: any) {
      // Error message is already shown by toast in deleteSection
      // But we can show a more specific message if needed
      if (error.response?.data?.error) {
        // Error already shown by toast
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Sections</DialogTitle>
          <DialogDescription>
            Add, rename, or delete task sections for this board. Sections with tasks cannot be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Section */}
          <div className="flex gap-2">
            <Input
              placeholder="New section name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddSection()
                }
              }}
              disabled={loading}
            />
            <Button
              onClick={handleAddSection}
              disabled={loading || !newSectionName.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </div>

          {/* Sections List */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No sections found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedSections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>{section.order + 1}</TableCell>
                      <TableCell>
                        {editingId === section.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(section.id)
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(section.id)}
                              disabled={loading}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-medium">{section.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === section.id ? null : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(section)}
                              disabled={loading}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(section.id, section.name)}
                              disabled={loading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

