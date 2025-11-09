export const durationMs = {
  instant: 120,
  fast: 200,
  base: 320,
  relaxed: 420,
  slow: 550,
} as const

export const durationSeconds = Object.fromEntries(
  Object.entries(durationMs).map(([key, value]) => [key, Number((value / 1000).toFixed(3))]),
) as Record<keyof typeof durationMs, number>

export const easingCurves = {
  standard: {
    css: 'cubic-bezier(0.2, 0, 0.38, 0.9)',
    motion: [0.2, 0, 0.38, 0.9],
  },
  emphasized: {
    css: 'cubic-bezier(0.1, 0, 0, 1)',
    motion: [0.1, 0, 0, 1],
  },
  out: {
    css: 'cubic-bezier(0, 0, 0.2, 1)',
    motion: [0, 0, 0.2, 1],
  },
  in: {
    css: 'cubic-bezier(0.3, 0, 1, 1)',
    motion: [0.3, 0, 1, 1],
  },
} as const

export const springConfigs = {
  ui: { tension: 220, friction: 28, clamp: false },
  gentle: { tension: 170, friction: 24, clamp: false },
  overlay: { tension: 260, friction: 32, clamp: false, mass: 1.05 },
} as const

export const motionTransitions = {
  enter: { duration: durationSeconds.base, ease: easingCurves.standard.motion },
  exit: { duration: durationSeconds.fast, ease: easingCurves.out.motion },
  emphasize: { duration: durationSeconds.relaxed, ease: easingCurves.emphasized.motion },
} as const

export const lenisConfig = {
  duration: 1.05,
  lerp: 0.085,
  smoothWheel: true,
  smoothTouch: false,
  wheelMultiplier: 1,
  touchMultiplier: 1.3,
  easing: (t: number) => 1 - Math.pow(1 - t, 2),
}

export const autoAnimateDefaults = {
  duration: durationMs.fast,
  easing: easingCurves.standard.css,
}

export function getSpringConfig(preset: keyof typeof springConfigs = 'ui') {
  return springConfigs[preset]
}

export function getMotionTransition(preset: keyof typeof motionTransitions = 'enter') {
  return motionTransitions[preset]
}

export function createStagger(step: number = durationSeconds.fast / 2) {
  const interval = Number(step.toFixed(3))
  return {
    staggerChildren: interval,
    delayChildren: Number((interval / 2).toFixed(3)),
  }
}

export const animationTokens = {
  durationMs,
  durationSeconds,
  easingCurves,
  springConfigs,
  motionTransitions,
}

export const landingHeroVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        ...createStagger(durationSeconds.fast / 1.5),
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: durationSeconds.relaxed,
        ease: easingCurves.out.motion,
      },
    },
  },
  pill: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: durationSeconds.base,
        ease: easingCurves.standard.motion,
      },
    },
  },
}

export const heroBackgroundVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durationSeconds.slow,
      ease: easingCurves.emphasized.motion,
    },
  },
}

export const ctaHoverMotion = {
  whileHover: { scale: 1.015, y: -2 },
  whileTap: { scale: 0.985 },
  transition: {
    type: 'spring',
    stiffness: 320,
    damping: 24,
  },
}

export const panelVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durationSeconds.base,
      ease: motionTransitions.enter.ease,
    },
  },
}

export function createStaggeredContainer(step = 0.1) {
  return {
    hidden: {},
    visible: {
      transition: {
        ...createStagger(step),
      },
    },
  }
}

export const listItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durationSeconds.base,
      ease: motionTransitions.enter.ease,
    },
  },
}
