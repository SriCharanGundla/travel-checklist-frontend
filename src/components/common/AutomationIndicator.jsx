import { forwardRef, useMemo } from 'react'
import { motion } from 'motion/react'
import { durationSeconds, easingCurves } from '@/lib/animation'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'
import { cn } from '@/lib/utils'

const STATUS_LABELS = {
  idle: 'Up to date',
  syncing: 'Syncing workspace…',
  success: 'Synced',
  error: 'Needs attention',
}

const toneStyles = {
  primary: {
    '--indicator-color': 'var(--primary)',
  },
  success: {
    '--indicator-color': '142 71% 45%', // emerald 500
  },
  warning: {
    '--indicator-color': '37 92% 50%', // amber 500
  },
  info: {
    '--indicator-color': '199 89% 48%', // sky 500
  },
}

const rippleAnimation = {
  syncing: {
    scale: [1, 1.45, 1.75],
    opacity: [0.35, 0.75, 0],
    transition: {
      duration: durationSeconds.relaxed * 2,
      ease: easingCurves.emphasized.motion,
      repeat: Infinity,
    },
  },
  success: {
    scale: [0.9, 1.3],
    opacity: [0.3, 0],
    transition: {
      duration: durationSeconds.base,
      ease: easingCurves.out.motion,
    },
  },
  error: {
    scale: [1, 1.35, 1],
    opacity: [0.45, 0.8, 0.45],
    transition: {
      duration: durationSeconds.base,
      ease: easingCurves.standard.motion,
      repeat: Infinity,
    },
  },
}

const dotAnimation = {
  syncing: {
    scale: [0.9, 1.08, 0.92],
    transition: {
      duration: durationSeconds.relaxed,
      ease: easingCurves.standard.motion,
      repeat: Infinity,
    },
  },
  success: {
    scale: [0.9, 1.08, 1],
    transition: {
      duration: durationSeconds.base,
      ease: easingCurves.out.motion,
    },
  },
  error: {
    scale: [1, 0.92, 1],
    transition: {
      duration: durationSeconds.fast,
      ease: easingCurves.emphasized.motion,
      repeat: Infinity,
    },
  },
}

const AutomationIndicator = forwardRef(function AutomationIndicator(
  {
    status = 'syncing',
    label,
    tone = 'primary',
    showLabel = true,
    ariaLive = 'polite',
    className,
    labelClassName,
  },
  ref,
) {
  const { prefersReducedMotion } = useAnimationSettings()
  const resolvedLabel = label ?? STATUS_LABELS[status] ?? STATUS_LABELS.idle
  const toneStyle = toneStyles[tone] || toneStyles.primary

  const rippleProps = useMemo(() => {
    if (prefersReducedMotion) {
      return null
    }
    return rippleAnimation[status]
  }, [prefersReducedMotion, status])

  const dotProps = useMemo(() => {
    if (prefersReducedMotion) {
      return null
    }
    return dotAnimation[status]
  }, [prefersReducedMotion, status])

  const isIdle = status === 'idle'

  return (
    <div
      ref={ref}
      role="status"
      aria-live={ariaLive}
      className={cn('inline-flex items-center gap-2 text-xs font-medium text-muted-foreground', className)}
      style={toneStyle}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {!isIdle && rippleProps ? (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: 'hsl(var(--indicator-color) / 0.25)' }}
            {...rippleProps}
          />
        ) : (
          <span
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: 'hsl(var(--indicator-color) / 0.15)' }}
          />
        )}

        <motion.span
          className="relative h-2 w-2 rounded-full shadow-[0_0_12px_hsl(var(--indicator-color)/0.45)]"
          style={{ backgroundColor: 'hsl(var(--indicator-color))' }}
          animate={dotProps ?? undefined}
        />
      </span>
      {showLabel ? (
        <span className={cn('text-xs text-muted-foreground', labelClassName)}>{resolvedLabel}</span>
      ) : null}
    </div>
  )
})

export { AutomationIndicator }
