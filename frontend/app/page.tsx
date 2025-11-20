'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import { useAuthStore } from '@/store/authStore'
import BoardList from '@/components/BoardList'
import KanbanBoard from '@/components/KanbanBoard'
import Header from '@/components/Header'
import LoadingSkeleton from '@/components/LoadingSkeleton'

// Helper function to check if token exists in localStorage
// This prevents redirect loops when Zustand persist hasn't synced yet
const hasTokenInStorage = (): boolean => {
  if (typeof window === 'undefined') return false
  
  try {
    const authData = localStorage.getItem('auth-storage')
    if (!authData) return false
    
    const parsed = JSON.parse(authData)
    return !!(parsed?.state?.token)
  } catch (error) {
    return false
  }
}

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
    
    // Only redirect if we're sure user is not authenticated AND no token in storage
    // This prevents redirect when token exists but Zustand state hasn't synced yet
    // This is critical for production where state sync timing can cause issues
    if (!isAuthenticated && !authLoading && !hasTokenInStorage()) {
      router.push('/login')
      return
    }
    
    if (isAuthenticated && !authLoading) {
      fetchBoards()
    }
  }, [isAuthenticated, authLoading, router, fetchBoards])

  // Show loading if auth is loading OR if not authenticated and no token in storage
  // Don't show loading if token exists (user might be authenticated, just state not synced)
  if (authLoading || (!isAuthenticated && !authLoading && !hasTokenInStorage())) {
    return <LoadingSkeleton />
  }

  if (loading && boards.length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
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



