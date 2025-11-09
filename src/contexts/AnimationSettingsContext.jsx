import { createContext, useContext } from 'react'

const AnimationSettingsContext = createContext({
  prefersReducedMotion: true,
  pauseLenis: () => {},
  resumeLenis: () => {},
  userMotionPreference: 'system',
  setReducedMotionPreference: () => {},
})

export function useAnimationSettings() {
  return useContext(AnimationSettingsContext)
}

export default AnimationSettingsContext
