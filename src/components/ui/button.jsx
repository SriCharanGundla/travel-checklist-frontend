import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60'

const variantClasses = {
  default: 'bg-primary text-white hover:bg-primary/90 focus-visible:ring-primary/40',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300',
  outline: 'border border-slate-200 text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-200',
  ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-200',
  destructive: 'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-300',
}

const sizeClasses = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-6 text-base',
  icon: 'h-10 w-10',
}

const buttonVariants = ({ variant = 'default', size = 'default' } = {}) =>
  cn(baseClasses, variantClasses[variant] || variantClasses.default, sizeClasses[size] || sizeClasses.default)

const Button = forwardRef(
  ({ className, variant = 'default', size = 'default', type = 'button', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
