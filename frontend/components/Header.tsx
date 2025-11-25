'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'
import { useTheme } from './ThemeProvider'
import { Moon, Sun, ArrowLeft, Plus, LogOut, User, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import Logo from './Logo'
import { Badge } from '@/components/ui/badge'
import UserManagement from './UserManagement'

export default function Header() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { selectedBoard, selectBoard, createBoard } = useBoardStore()
  const { user, company, logout } = useAuthStore()
  const { users, fetchUsers } = useUserStore()
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDescription, setBoardDescription] = useState('')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])

  useEffect(() => {
    if (showCreateBoard) {
      fetchUsers()
    }
  }, [showCreateBoard, fetchUsers])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleCreateBoard = async () => {
    if (!boardName.trim()) return
    try {
      await createBoard(boardName, boardDescription, selectedAssignees)
      setBoardName('')
      setBoardDescription('')
      setSelectedAssignees([])
      setShowCreateBoard(false)
    } catch (error) {
      // Error handled by toast
    }
  }

  const toggleAssignee = (userName: string) => {
    setSelectedAssignees(prev =>
      prev.includes(userName)
        ? prev.filter(name => name !== userName)
        : [...prev, userName]
    )
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedBoard && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => selectBoard(null)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            {selectedBoard ? (
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {selectedBoard.name}
                </h1>
                {company && (
                  <Badge variant="secondary" className="text-xs">
                    {company.name}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Logo size="md" />
                {company && (
                  <Badge variant="secondary" className="text-xs">
                    {company.name}
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {!selectedBoard && user?.role === 'admin' && (
              <Button
                onClick={() => setShowCreateBoard(!showCreateBoard)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Board
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                    {user.name}
                  </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                      {user.role === 'admin' && (
                        <Badge variant="default" className="mt-1 text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setShowUserManagement(!showUserManagement)}
                        className="cursor-pointer"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                      onClick={handleLogout}
                    className="text-destructive cursor-pointer"
                    >
                    <LogOut className="w-4 h-4 mr-2" />
                      Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {showCreateBoard && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Input
              type="text"
              placeholder="Board name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
            />
                <Textarea
              placeholder="Description (optional)"
              value={boardDescription}
              onChange={(e) => setBoardDescription(e.target.value)}
              rows={2}
            />
                <div>
                  <Label className="mb-2 block">
                Assign to Users (optional)
                  </Label>
                  <Card className="max-h-32 overflow-y-auto">
                    <CardContent className="p-2">
                {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading users...</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u._id}
                            className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                    >
                            <Checkbox
                        checked={selectedAssignees.includes(u.name)}
                              onCheckedChange={() => toggleAssignee(u.name)}
                      />
                            <span className="text-sm text-foreground">{u.name}</span>
                    </label>
                  ))
                )}
                    </CardContent>
                  </Card>
            </div>
            <div className="flex gap-2">
                  <Button
                onClick={handleCreateBoard}
              >
                Create
                  </Button>
                  <Button
                    variant="secondary"
                onClick={() => {
                  setShowCreateBoard(false)
                  setBoardName('')
                  setBoardDescription('')
                  setSelectedAssignees([])
                }}
              >
                Cancel
                  </Button>
                </div>
            </div>
            </CardContent>
          </Card>
        )}

        {showUserManagement && (
          <div className="mt-4">
            <UserManagement />
          </div>
        )}
      </div>
    </header>
  )
}

