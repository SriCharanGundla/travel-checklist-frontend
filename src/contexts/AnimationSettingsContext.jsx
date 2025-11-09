import { createContext, useContext } from 'react'

const AnimationSettingsContext = createContext({
  prefersReducedMotion: true,
  pauseLenis: () => {},
  resumeLenis: () => {},
  userMotionPreference: 'system',
  setReducedMotionPreference: () => {},
  enableHapticHints: false,
  setEnableHapticHints: () => {},
})

export function useAnimationSettings() {
  return useContext(AnimationSettingsContext)
}

export default AnimationSettingsContext
