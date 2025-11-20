'use client'

import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg p-6 h-96 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="rounded-lg p-4 h-24" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}





