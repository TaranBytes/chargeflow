// Generic skeleton block. Compose into bigger placeholders below.
export function Skeleton({ className = '', rounded = 'rounded-md' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-white/10 ${rounded} ${className}`}
    />
  )
}

// Pre-built placeholder for the station list rows on the map page.
export function StationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-12 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-3 w-20 rounded-lg" />
    </div>
  )
}

// Pre-built placeholder for the charger grid on station detail.
export function ChargerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[rgba(255,255,255,0.03)] p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
    </div>
  )
}

// Map area placeholder.
export function MapSkeleton() {
  return (
    <div className="map-loading-shimmer grid h-full w-full place-items-center rounded-3xl">
      <div className="text-center text-sm text-[rgba(255,255,255,0.65)]">
        <svg
          className="mx-auto mb-2 h-8 w-8 opacity-50"
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
