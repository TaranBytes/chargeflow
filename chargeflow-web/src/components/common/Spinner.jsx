// Lightweight inline spinner — pure CSS, no extra deps.
const SIZE = {
  xs: 'w-3 h-3 border',
  sm: 'w-4 h-4 border',
  md: 'w-5 h-5 border-2',
  lg: 'w-7 h-7 border-2',
  xl: 'w-10 h-10 border-2',
}

export default function Spinner({ size = 'md', className = '', label }) {
  return (
    <span
      role="status"
      aria-label={label || 'Loading'}
      className={`inline-block rounded-full border-current border-t-transparent animate-spin align-[-2px] ${SIZE[size]} ${className}`}
    />
  )
}
