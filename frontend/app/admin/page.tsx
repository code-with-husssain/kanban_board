'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { Shield, User, UserCheck, UserX, Lock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Check if secret is already verified in session
  useEffect(() => {
    const verified = sessionStorage.getItem('admin-secret-verified')
    const secret = sessionStorage.getItem('admin-secret')
    if (verified === 'true' && secret) {
      setAdminSecret(secret)
      setIsVerified(true)
      fetchUsers(secret)
    }
  }, [])

  const handleVerifySecret = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminSecret.trim()) {
      toast.error('Please enter admin secret')
      return
    }

    setVerifying(true)
    try {
      await adminAPI.verifySecret(adminSecret)
      setIsVerified(true)
      sessionStorage.setItem('admin-secret-verified', 'true')
      sessionStorage.setItem('admin-secret', adminSecret)
      toast.success('Admin secret verified!')
      fetchUsers(adminSecret)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Invalid admin secret'
      toast.error(errorMessage)
    } finally {
      setVerifying(false)
    }
  }

  const fetchUsers = async (secret: string) => {
    setLoading(true)
    try {
      const response = await adminAPI.getAllUsers(secret)
      setUsers(response.data)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to fetch users'
      toast.error(errorMessage)
      if (error.response?.status === 401) {
        // Secret expired or invalid, reset
        setIsVerified(false)
        sessionStorage.removeItem('admin-secret-verified')
        sessionStorage.removeItem('admin-secret')
        setAdminSecret('')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetAdmin = async (userId: string) => {
    if (!adminSecret) return

    try {
      const response = await adminAPI.setAdmin(userId, adminSecret)
      toast.success(response.data.message)
      fetchUsers(adminSecret)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to set admin'
      toast.error(errorMessage)
      if (error.response?.status === 401) {
        setIsVerified(false)
        sessionStorage.removeItem('admin-secret-verified')
        sessionStorage.removeItem('admin-secret')
        setAdminSecret('')
      }
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!adminSecret) return

    try {
      const response = await adminAPI.removeAdmin(userId, adminSecret)
      toast.success(response.data.message)
      fetchUsers(adminSecret)
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to remove admin'
      toast.error(errorMessage)
      if (error.response?.status === 401) {
        setIsVerified(false)
        sessionStorage.removeItem('admin-secret-verified')
        sessionStorage.removeItem('admin-secret')
        setAdminSecret('')
      }
    }
  }

  const handleLogout = () => {
    setIsVerified(false)
    setAdminSecret('')
    setUsers([])
    sessionStorage.removeItem('admin-secret-verified')
    sessionStorage.removeItem('admin-secret')
    toast.success('Logged out from admin panel')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-primary" />
            </div>
            <CardTitle className="text-3xl mb-2">
              Admin Access
            </CardTitle>
            <CardDescription>
              Enter your admin secret to access the management panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifySecret} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="admin-secret">Admin Secret</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="admin-secret"
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="pl-10"
                    placeholder="Enter admin secret"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={verifying}
                className="w-full"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Verify & Access
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-6xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
              <div>
                  <CardTitle className="text-3xl">
                  Admin Management
                  </CardTitle>
                  <CardDescription>
                  Manage user roles and permissions
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="secondary"
              onClick={handleLogout}
                className="flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Logout
              </Button>
          </div>
          </CardHeader>
          <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                {users.length}
              </div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground/80">
                {users.filter(u => u.role === 'admin').length}
              </div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground/60">
                {users.filter(u => u.role === 'user').length}
              </div>
                  <div className="text-sm text-muted-foreground">Regular Users</div>
                </CardContent>
              </Card>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                            {user.name}
                          </span>
                        </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                        {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                        >
                          {user.role === 'admin' ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {user.role || 'user'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role === 'admin' ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveAdmin(user._id)}
                              className="flex items-center gap-1"
                            >
                              <UserX className="w-4 h-4" />
                              Remove Admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSetAdmin(user._id)}
                              className="flex items-center gap-1"
                            >
                              <UserCheck className="w-4 h-4" />
                              Make Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
                </Table>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-end">
              <Button
              onClick={() => fetchUsers(adminSecret)}
              disabled={loading}
                className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
              </Button>
          </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

