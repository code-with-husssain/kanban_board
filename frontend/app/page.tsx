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
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Wait for auth check to complete before making redirect decisions
    if (authLoading) {
      return // Still checking auth, don't redirect yet
    }
    
    if (!isAuthenticated) {
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



