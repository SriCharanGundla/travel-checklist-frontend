import { useAutoAnimate } from '@formkit/auto-animate/react'
import { autoAnimateDefaults } from '@/lib/animation'

export function useAutoAnimateList(options) {
  return useAutoAnimate({
    ...autoAnimateDefaults,
    ...options,
  })
}
