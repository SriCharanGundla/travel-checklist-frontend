import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './input'
import { cn } from '../../lib/utils'

const SensitiveInput = forwardRef(
  (
    {
      className,
      type = 'text',
      revealType,
      hiddenType = 'password',
      initiallyVisible = false,
      toggleLabel = 'Toggle visibility',
      leadingIcon: LeadingIcon,
      leadingIconClassName,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(initiallyVisible)

    const resolvedRevealType = revealType ?? (type === 'password' ? 'text' : type)
    const inputType = visible ? resolvedRevealType : hiddenType

    const handleToggle = () => {
      setVisible((prev) => !prev)
    }

    return (
      <div className="relative">
        {LeadingIcon ? (
          <LeadingIcon
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
              leadingIconClassName,
            )}
            aria-hidden="true"
          />
        ) : null}
        <Input
          ref={ref}
          type={inputType}
          className={cn('pr-11', LeadingIcon ? 'pl-9' : '', className)}
          data-sensitive-visible={visible ? 'true' : 'false'}
          {...props}
        />
        <button
          type="button"
          onClick={handleToggle}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-sm px-1.5 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={toggleLabel}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    )
  },
)

SensitiveInput.displayName = 'SensitiveInput'

export { SensitiveInput }
