import { useMemo, useCallback, useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { SpringContext } from '@react-spring/web'
import { ReactLenis, useLenis } from 'lenis/react'
import { lenisConfig, getSpringConfig, motionTransitions } from '@/lib/animation'
import AnimationSettingsContext from '@/contexts/AnimationSettingsContext.jsx'
import { useReducedMotionPreference } from '@/hooks/useReducedMotionPreference.js'

const MOTION_PREFERENCE_STORAGE_KEY = 'travel-checklist:motion-preference'

function AnimationProviders({ children }) {
  const systemPrefersReducedMotion = useReducedMotionPreference()
  const [userMotionPreference, setUserMotionPreference] = useState('system')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const storedPreference = window.localStorage.getItem(MOTION_PREFERENCE_STORAGE_KEY)
    if (storedPreference === 'motion' || storedPreference === 'reduced' || storedPreference === 'system') {
      setUserMotionPreference(storedPreference)
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
    }),
    [pauseLenis, prefersReducedMotion, resumeLenis, setReducedMotionPreference, userMotionPreference],
  )

  return (
    <AnimationSettingsContext.Provider value={contextValue}>
      {children}
    </AnimationSettingsContext.Provider>
  )
}

export default AnimationProviders
