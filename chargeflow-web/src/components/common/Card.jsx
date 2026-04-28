// Tiny styling primitive so cards across the app stay consistent.
const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
}

export default function Card({
  padding = 'md',
  hover = false,
  interactive = false,
  className = '',
  as: Tag = 'div',
  children,
  ...rest
}) {
  return (
    <Tag
      className={`bg-white border border-slate-200 rounded-xl ${PADDING[padding]} ${
        hover ? 'hover:border-slate-300 hover:shadow-sm transition-all' : ''
      } ${interactive ? 'cursor-pointer' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
