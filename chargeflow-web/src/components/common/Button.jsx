import Spinner from './Spinner.jsx'

const VARIANTS = {
  primary:
    'bg-ev-gold hover:bg-ev-goldHover text-ev-espresso shadow-sm shadow-black/25 disabled:bg-slate-600 disabled:text-slate-400 disabled:shadow-none',
  secondary:
    'bg-ev-sidebar/90 hover:bg-ev-sidebar text-white border border-white/10 disabled:opacity-50',
  outline:
    'bg-black/20 border border-ev-gold/35 hover:border-ev-gold/55 text-white disabled:opacity-60',
  ghost: 'bg-transparent hover:bg-white/5 text-white disabled:opacity-60',
  danger:
    'bg-rose-500 hover:bg-rose-400 text-white shadow-sm shadow-rose-900/20 disabled:bg-slate-600 disabled:text-slate-400 disabled:shadow-none',
  subtle: 'bg-white/5 hover:bg-white/10 text-white disabled:opacity-60',
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
      className={`inline-flex items-center justify-center font-medium transition-colors duration-250 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ev-gold/40 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children && <span>{children}</span>}
      {!loading && rightIcon}
    </button>
  )
}
