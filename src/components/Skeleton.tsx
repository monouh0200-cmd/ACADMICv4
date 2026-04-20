// Reusable skeleton loader components

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
      <div className="skeleton h-10 w-10 rounded-xl mb-4" />
      <div className="skeleton h-4 w-3/4 mb-2 rounded" />
      <div className="skeleton h-3 w-full mb-1 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-100">
      <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-8 w-20 rounded-lg" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100">
          <div className="skeleton h-9 w-9 rounded-xl mb-3" />
          <div className="skeleton h-6 w-16 rounded mb-1" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCourseGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100">
          <div className="skeleton h-36 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
