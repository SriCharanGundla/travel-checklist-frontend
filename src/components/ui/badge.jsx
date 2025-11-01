import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-600',
  info: 'bg-sky-100 text-sky-700',
}

const Badge = ({ className, variant = 'default', children, ...props }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge }
