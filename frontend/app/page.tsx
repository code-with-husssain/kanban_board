'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import BoardList from '@/components/BoardList'
import KanbanBoard from '@/components/KanbanBoard'
import Header from '@/components/Header'
import LoadingSkeleton from '@/components/LoadingSkeleton'

export default function Home() {
  const router = useRouter()
  const { selectedBoard, boards, loading, fetchBoards } = useBoardStore()
  const { isAuthenticated, checkAuth, loading: authLoading, token, user } = useAuthStore()

  useEffect(() => {
    // If we have token and user, set authenticated immediately
    if (token && user) {
      if (!isAuthenticated) {
        useAuthStore.setState({ isAuthenticated: true })
      }
      // Don't call checkAuth immediately - it might fail and clear auth
    } else {
      // No token/user, check auth
      checkAuth()
    }
  }, [checkAuth, token, user, isAuthenticated])

  useEffect(() => {
    // Don't redirect if we have token and user (even if isAuthenticated is temporarily false)
    // This prevents redirect loop after login
    if (!authLoading && !isAuthenticated && (!token || !user)) {
      router.push('/login')
      return
    }
    
    // If authenticated or have token/user, fetch boards
    if (isAuthenticated || (token && user)) {
      fetchBoards()
    }
  }, [isAuthenticated, authLoading, router, fetchBoards, token, user])

  const hasAuth = isAuthenticated || (token && user)
  
  if (authLoading || (!hasAuth && !authLoading)) {
    return <LoadingSkeleton />
  }

  if (loading && boards.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {selectedBoard ? (
          <KanbanBoard boardId={selectedBoard._id} />
        ) : (
          <BoardList />
        )}
      </main>
    </div>
  )
}



