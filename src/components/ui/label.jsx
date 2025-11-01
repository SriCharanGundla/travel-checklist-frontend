import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Label = forwardRef(({ className, required = false, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-slate-700', required && "after:ml-0.5 after:text-rose-500 after:content-['*']", className)}
      {...props}
    >
      {children}
    </label>
  )
})

Label.displayName = 'Label'

export { Label }
