import { useMemo } from 'react'
import { Waves, Vibrate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'

const iconMap = {
  on: Vibrate,
  off: Waves,
}

export default function HapticToggle({ className }) {
  const { enableHapticHints, setEnableHapticHints, prefersReducedMotion } = useAnimationSettings()

  const stateKey = enableHapticHints && !prefersReducedMotion ? 'on' : 'off'
  const Icon = useMemo(() => iconMap[stateKey] || Vibrate, [stateKey])
  const label = enableHapticHints && !prefersReducedMotion ? 'Disable haptic cues' : 'Enable haptic cues'

  const handleToggle = () => {
    if (prefersReducedMotion) {
      setEnableHapticHints(false)
      return
    }
    setEnableHapticHints(!enableHapticHints)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-pressed={enableHapticHints && !prefersReducedMotion}
      aria-label={label}
      title={prefersReducedMotion ? 'Reduce motion is on — haptics disabled' : label}
      className={cn(
        'relative h-9 w-9 rounded-md transition',
        enableHapticHints && !prefersReducedMotion ? 'text-primary' : 'text-muted-foreground',
        className,
      )}
      disabled={prefersReducedMotion}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </Button>
  )
}
