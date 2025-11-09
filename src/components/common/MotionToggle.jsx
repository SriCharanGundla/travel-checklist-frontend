import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'
import { Waves, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

const preferenceCycle = {
  reduced: 'motion',
  motion: 'reduced',
  system: 'reduced',
}

export default function MotionToggle({ className }) {
  const { prefersReducedMotion, userMotionPreference, setReducedMotionPreference } = useAnimationSettings()

  const isReduced =
    userMotionPreference === 'reduced' ||
    (userMotionPreference === 'system' && prefersReducedMotion)

  const nextPreference = preferenceCycle[userMotionPreference] || (isReduced ? 'motion' : 'reduced')

  const label = isReduced ? 'Enable subtle animations' : 'Reduce motion'

  const icon = useMemo(() => (isReduced ? Ban : Waves), [isReduced])
  const Icon = icon

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setReducedMotionPreference(nextPreference)}
      aria-pressed={isReduced}
      aria-label={label}
      title={`${label} (currently ${userMotionPreference})`}
      className={cn(
        'relative h-9 w-9 rounded-md transition',
        isReduced ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
