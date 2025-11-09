import { useMemo } from 'react'
import { useSpring } from '@react-spring/web'
import { getSpringConfig } from '@/lib/animation'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'

const sanitizeNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function useAnimatedNumber(value, options = {}) {
  const { preset = 'ui' } = options
  const { prefersReducedMotion } = useAnimationSettings()
  const targetValue = sanitizeNumber(value)

  const springConfig = useMemo(() => getSpringConfig(preset), [preset])

  const spring = useSpring({
    number: targetValue,
    config: springConfig,
    immediate: prefersReducedMotion || options.immediate,
  })

  return spring.number
}
