import { useMemo, useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { SpringContext } from '@react-spring/web'
import { ReactLenis, useLenis } from 'lenis/react'
import { lenisConfig, getSpringConfig, motionTransitions } from '@/lib/animation'
import AnimationSettingsContext from '@/contexts/AnimationSettingsContext.jsx'
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference.js'

const MOTION_PREFERENCE_STORAGE_KEY = 'travel-checklist:motion-preference'
const HAPTIC_STORAGE_KEY = 'travel-checklist:haptic-preference'

function AnimationProviders({ children }) {
  const systemPrefersReducedMotion = useReducedMotionPreference()
  const [userMotionPreference, setUserMotionPreference] = useState('system')
  const [enableHapticHints, setEnableHapticHints] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedPreference = window.localStorage.getItem(MOTION_PREFERENCE_STORAGE_KEY)
    if (storedPreference === 'motion' || storedPreference === 'reduced' || storedPreference === 'system') {
      setUserMotionPreference(storedPreference)
    }
    const storedHaptic = window.localStorage.getItem(HAPTIC_STORAGE_KEY)
    if (storedHaptic === 'enabled' || storedHaptic === 'disabled') {
      setEnableHapticHints(storedHaptic === 'enabled')
    }
  }, [])

  const setReducedMotionPreference = useCallback((preference) => {
    setUserMotionPreference(preference)
    if (typeof window === 'undefined') {
      return
    }
    if (preference === 'system') {
      window.localStorage.removeItem(MOTION_PREFERENCE_STORAGE_KEY)
    } else {
      window.localStorage.setItem(MOTION_PREFERENCE_STORAGE_KEY, preference)
    }
  }, [])

  const toggleHapticHints = useCallback((nextValue) => {
    setEnableHapticHints((prev) => {
      const resolved = typeof nextValue === 'boolean' ? nextValue : !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(HAPTIC_STORAGE_KEY, resolved ? 'enabled' : 'disabled')
      }
      return resolved
    })
  }, [])

  const prefersReducedMotion =
    userMotionPreference === 'system'
      ? systemPrefersReducedMotion
      : userMotionPreference === 'reduced'

  const springContextValue = useMemo(
    () => ({
      config: getSpringConfig(prefersReducedMotion ? 'gentle' : 'ui'),
      pause: false,
      immediate: prefersReducedMotion,
    }),
    [prefersReducedMotion],
  )

  const motionConfigProps = useMemo(
    () => ({
      transition: motionTransitions.enter,
      reducedMotion: prefersReducedMotion ? 'always' : 'never',
    }),
    [prefersReducedMotion],
  )

  useEffect(() => {
    if (prefersReducedMotion) {
      setEnableHapticHints(false)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(HAPTIC_STORAGE_KEY, 'disabled')
      }
    }
  }, [prefersReducedMotion])

  const resolvedLenisOptions = useMemo(
    () =>
      prefersReducedMotion
        ? {
            ...lenisConfig,
            smoothWheel: false,
            smoothTouch: false,
            lerp: 1,
          }
        : lenisConfig,
    [prefersReducedMotion],
  )

  return (
    <MotionConfig {...motionConfigProps}>
      <SpringContext.Provider value={springContextValue}>
        <ReactLenis root options={resolvedLenisOptions}>
          <LenisAccessibilityAdapter
            prefersReducedMotion={prefersReducedMotion}
            userMotionPreference={userMotionPreference}
            setReducedMotionPreference={setReducedMotionPreference}
            enableHapticHints={enableHapticHints}
            setEnableHapticHints={toggleHapticHints}
          >
            {children}
          </LenisAccessibilityAdapter>
        </ReactLenis>
      </SpringContext.Provider>
    </MotionConfig>
  )
}

function LenisAccessibilityAdapter({
  prefersReducedMotion,
  userMotionPreference,
  setReducedMotionPreference,
  enableHapticHints,
  setEnableHapticHints,
  children,
}) {
  const lenis = useLenis()

  const pauseLenis = useCallback(() => {
    lenis?.stop()
  }, [lenis])

  const resumeLenis = useCallback(() => {
    lenis?.start()
  }, [lenis])

  useEffect(() => {
    if (!lenis) {
      return
    }

    if (prefersReducedMotion) {
      pauseLenis()
    } else {
      resumeLenis()
    }
  }, [lenis, pauseLenis, prefersReducedMotion, resumeLenis])

  const contextValue = useMemo(
    () => ({
      prefersReducedMotion,
      pauseLenis,
      resumeLenis,
      userMotionPreference,
      setReducedMotionPreference,
      enableHapticHints,
      setEnableHapticHints,
    }),
    [enableHapticHints, pauseLenis, prefersReducedMotion, resumeLenis, setEnableHapticHints, userMotionPreference, setReducedMotionPreference],
  )

  return (
    <AnimationSettingsContext.Provider value={contextValue}>
      {children}
    </AnimationSettingsContext.Provider>
  )
}

export default AnimationProviders
