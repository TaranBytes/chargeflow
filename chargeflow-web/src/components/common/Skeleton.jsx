// Generic skeleton block. Compose into bigger placeholders below.
export function Skeleton({ className = '', rounded = 'rounded-md' }) {
  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200/70 animate-pulse ${rounded} ${className}`}
    />
  )
}

// Pre-built placeholder for the station list rows on the map page.
export function StationCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-3 w-8" />
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <Skeleton className="h-3 w-20 mt-3" />
    </div>
  )
}

// Pre-built placeholder for the charger grid on station detail.
export function ChargerCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-lg" />
    </div>
  )
}

// Map area placeholder.
export function MapSkeleton() {
  return (
    <div className="h-full w-full bg-slate-100 animate-pulse grid place-items-center">
      <div className="text-center text-slate-400 text-sm">
        <svg
          className="w-8 h-8 mx-auto mb-2 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        Loading map…
      </div>
    </div>
  )
}
