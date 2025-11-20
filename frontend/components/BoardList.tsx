'use client'

import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function BoardList() {
  const { boards, selectBoard, deleteBoard } = useBoardStore()
  const { user } = useAuthStore()
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
                    <Button
                      variant="ghost"
                      size="icon"
                    onClick={(e) => handleDelete(board._id, e)}
                    disabled={deletingId === board._id}
                      className="opacity-0 group-hover:opacity-100 h-8 w-8 text-destructive hover:bg-destructive/10"
                  >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
    </div>
  )
}



