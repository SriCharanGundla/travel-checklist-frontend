import { useEffect, useState } from 'react'

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

export function useReducedMotionPreference(defaultValue = true) {
  const getInitialValue = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return defaultValue
    }
    return window.matchMedia(MEDIA_QUERY).matches
  }

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getInitialValue)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQueryList = window.matchMedia(MEDIA_QUERY)
    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches)
    }

    if (typeof mediaQueryList.addEventListener === 'function') {
      mediaQueryList.addEventListener('change', handleChange)
    } else {
      mediaQueryList.addListener(handleChange)
    }

    setPrefersReducedMotion(mediaQueryList.matches)

    return () => {
      if (typeof mediaQueryList.removeEventListener === 'function') {
        mediaQueryList.removeEventListener('change', handleChange)
      } else {
        mediaQueryList.removeListener(handleChange)
      }
    }
  }, [])

  return prefersReducedMotion
}
