import Spinner from './Spinner.jsx'

const VARIANTS = {
  primary:
    'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400',
  outline:
    'bg-white border border-slate-200 hover:border-slate-300 text-slate-900 disabled:opacity-60',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-700 disabled:opacity-60',
  danger:
    'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  subtle:
    'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-60',
}

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
  lg: 'text-sm px-4 py-2.5 rounded-lg gap-2',
  xl: 'text-base px-5 py-3 rounded-lg gap-2',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
}
