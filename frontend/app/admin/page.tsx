'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api'
import { motion } from 'framer-motion'
import { Shield, User, UserCheck, UserX, Lock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Shield className="w-16 h-16 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Access
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter your admin secret to access the management panel
              </p>
            </div>

            <form onSubmit={handleVerifySecret} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Secret
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    placeholder="Enter admin secret"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Verify & Access
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Admin Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage user roles and permissions
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Logout
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {users.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {users.filter(u => u.role === 'user').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Regular Users</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No users found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <User className="w-3 h-3" />
                          )}
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {user.role === 'admin' ? (
                            <button
                              onClick={() => handleRemoveAdmin(user._id)}
                              className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                              <UserX className="w-4 h-4" />
                              Remove Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetAdmin(user._id)}
                              className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1 text-sm font-medium"
                            >
                              <UserCheck className="w-4 h-4" />
                              Make Admin
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => fetchUsers(adminSecret)}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

