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
  const { isAuthenticated, checkAuth, loading: authLoading } = useAuthStore()

  useEffect(() => {
    // Only check auth if we don't already have a token and user
    // This prevents clearing auth state right after login
    const authState = useAuthStore.getState()
    if (!authState.token || !authState.user) {
      checkAuth()
    } else {
      // If we have token and user, ensure isAuthenticated is set
      // Don't call checkAuth to avoid unnecessary API calls that might fail
      if (!authState.isAuthenticated) {
        useAuthStore.setState({ isAuthenticated: true })
      }
    }
  }, [checkAuth])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
      return
    }
    if (isAuthenticated) {
      fetchBoards()
    }
  }, [isAuthenticated, authLoading, router, fetchBoards])

  if (authLoading || (!isAuthenticated && !authLoading)) {
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



