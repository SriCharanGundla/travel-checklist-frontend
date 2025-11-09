import { memo, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'

const pulseTransition = {
  duration: 1.6,
  repeat: Infinity,
  ease: 'easeInOut',
}

const GestureHintComponent = ({
  visible,
  message,
  icon = '↔',
  className,
  tone = 'primary',
}) => {
  const { prefersReducedMotion, enableHapticHints } = useAnimationSettings()
  const audioContextRef = useRef(null)

  const triggerTone = useCallback(() => {
    if (typeof window === 'undefined') return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const now = ctx.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(480, now)
    gainNode.gain.setValueAtTime(0.0001, now)
    gainNode.gain.exponentialRampToValueAtTime(0.03, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    oscillator.connect(gainNode).connect(ctx.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.16)
  }, [])

  useEffect(() => {
    if (!visible || prefersReducedMotion || !enableHapticHints) {
      return
    }
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      window.navigator.vibrate(12)
    }
    triggerTone()
  }, [enableHapticHints, prefersReducedMotion, triggerTone, visible])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          className={cn(
            'pointer-events-none relative inline-flex items-center gap-2 overflow-hidden rounded-full border bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow-lg shadow-black/10 backdrop-blur',
            tone === 'primary' && 'border-primary/40 text-primary',
            tone === 'muted' && 'border-border text-muted-foreground',
            tone === 'destructive' && 'border-destructive/40 text-destructive',
            className,
          )}
          aria-live="polite"
        >
          <motion.span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-sm"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [1, 1.1, 1],
                  }
            }
            transition={prefersReducedMotion ? undefined : pulseTransition}
          >
            {icon}
          </motion.span>
          {enableHapticHints && !prefersReducedMotion ? (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-primary/30"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.8, 1.4, 1.65] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
            />
          ) : null}
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export const GestureHint = memo(GestureHintComponent)

export default GestureHint
