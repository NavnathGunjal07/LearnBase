export default function TopicSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Topic Card Skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-4">
          {/* Topic Header */}
          <div className="flex items-center px-3 py-2">
            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>

          {/* Subtopics */}
          <div className="px-4 pb-2 space-y-3">
            {/* Basic Level */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="space-y-1">
                {[1, 2].map((j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>

            {/* Intermediate Level */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="space-y-1">
                {[1, 2].map((j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>

            {/* Advanced Level */}
            <div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="space-y-1">
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
