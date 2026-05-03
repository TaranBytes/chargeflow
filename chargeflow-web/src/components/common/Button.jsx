import Spinner from './Spinner.jsx'

const VARIANTS = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-white shadow-sm shadow-emerald-900/40 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:bg-slate-800 disabled:text-slate-500',
  outline:
    'bg-slate-900/60 border border-slate-700 hover:border-slate-600 text-slate-100 disabled:opacity-60',
  ghost:
    'bg-transparent hover:bg-slate-800 text-slate-200 disabled:opacity-60',
  danger:
    'bg-rose-500 hover:bg-rose-400 text-white shadow-sm shadow-rose-900/20 disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none',
  subtle:
    'bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-60',
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
      className={`inline-flex items-center justify-center font-medium transition-colors disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
}
