import { AlertTriangle, RotateCw } from 'lucide-react'
import Button from './Button.jsx'

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn’t load this right now. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-500/35 bg-black/30 p-6 text-center backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-rose-500/15 text-rose-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-white/70">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" leftIcon={<RotateCw className="h-3.5 w-3.5" />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
