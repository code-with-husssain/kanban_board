'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/lib/api'
import { Users, Shield, User as UserIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import toast from 'react-hot-toast'

interface CompanyUser {
  _id: string
  name: string
  email: string
  role: string
  companyId: string
}

export default function UserManagement() {
  const { user: currentUser, company } = useAuthStore()
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await authAPI.getAllUsers()
      setUsers(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch users'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async (userId: string) => {
    if (promoting) return
    setPromoting(userId)
    try {
      await authAPI.promoteUser(userId)
      toast.success('User promoted to admin successfully!')
      fetchUsers()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to promote user'
      toast.error(errorMessage)
    } finally {
      setPromoting(null)
    }
  }

  const handleDemote = async (userId: string) => {
    if (promoting) return
    setPromoting(userId)
    try {
      await authAPI.demoteUser(userId)
      toast.success('User demoted to regular user successfully!')
      fetchUsers()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to demote user'
      toast.error(errorMessage)
    } finally {
      setPromoting(null)
    }
  }

  if (!isAdmin) {
    return null
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const regularUserCount = users.filter(u => u.role === 'user').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage users and roles for {company?.name || 'your company'}
              {company?.domain && (
                <span className="ml-2 text-xs">({company.domain})</span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found in your company
          </div>
        ) : (
          <>
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{adminCount}</span>
                <span className="text-sm text-muted-foreground">Admins</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{regularUserCount}</span>
                <span className="text-sm text-muted-foreground">Users</span>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3 h-3 mr-1" />
                            User
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {user._id === currentUser?._id ? (
                        <span className="text-sm text-muted-foreground">You</span>
                      ) : user.role === 'admin' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDemote(user._id)}
                          disabled={promoting === user._id || adminCount <= 1}
                          title={
                            adminCount <= 1
                              ? 'Cannot demote the last admin'
                              : 'Demote to user'
                          }
                        >
                          <ArrowDown className="w-4 h-4 mr-1" />
                          Demote
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromote(user._id)}
                          disabled={promoting === user._id}
                        >
                          <ArrowUp className="w-4 h-4 mr-1" />
                          Promote
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}

