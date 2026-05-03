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
      className={`bg-slate-900/70 border border-rose-800/70 rounded-xl p-6 text-center ${className}`}
    >
      <div className="w-12 h-12 mx-auto rounded-full bg-rose-900/30 grid place-items-center text-rose-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" leftIcon={<RotateCw className="w-3.5 h-3.5" />} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
