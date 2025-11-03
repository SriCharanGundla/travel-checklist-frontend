import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { buildMaskedSecret } from '../../utils/privacy'
import { cn } from '../../lib/utils'

export const SensitiveValue = ({ value, emptyPlaceholder = '—', className = '' }) => {
  const [visible, setVisible] = useState(false)

  if (!value) {
    return <span className={cn('text-muted-foreground', className)}>{emptyPlaceholder}</span>
  }

  const masked = buildMaskedSecret(String(value))

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="font-mono tracking-wide">{visible ? value : masked}</span>
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={visible ? 'Hide value' : 'Show value'}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </span>
  )
}

export default SensitiveValue
