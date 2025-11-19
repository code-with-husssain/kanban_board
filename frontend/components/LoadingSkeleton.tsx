'use client'

export default function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 h-96">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-gray-300 dark:bg-gray-600 rounded-lg p-4 h-24"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}





