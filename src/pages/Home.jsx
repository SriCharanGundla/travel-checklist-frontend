import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'
import {
  landingHeroVariants,
  heroBackgroundVariants,
  ctaHoverMotion,
} from '@/lib/animation'

const Home = () => {
  const { user } = useAuth()
  const { prefersReducedMotion } = useAnimationSettings()
  const buttonMotionProps = prefersReducedMotion ? {} : ctaHoverMotion

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={landingHeroVariants.container}
      id="landing-content"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-16 text-center"
      aria-labelledby="landing-title"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 blur-3xl"
        initial="initial"
        animate="animate"
        variants={heroBackgroundVariants}
      >
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20" />
        <div className="absolute right-10 bottom-10 h-64 w-64 rounded-full bg-secondary/20" />
      </motion.div>

      <motion.div variants={landingHeroVariants.item} className="relative max-w-2xl space-y-6">
        <motion.span
          variants={landingHeroVariants.pill}
          className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary shadow-sm"
        >
          Travel Checklist
        </motion.span>
        <motion.h1 id="landing-title" variants={landingHeroVariants.item} className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Plan smarter, travel lighter.
        </motion.h1>
        <motion.p variants={landingHeroVariants.item} className="text-lg text-muted-foreground">
          Organize documents, itineraries, budgets, and checklists in one collaborative workspace. Stay ready for every international trip.
        </motion.p>
        <motion.div variants={landingHeroVariants.item} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <motion.div {...buttonMotionProps} className="w-full sm:w-auto">
              <Button asChild size="lg" className="w-full justify-center">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </motion.div>
          ) : (
            <>
              <motion.div {...buttonMotionProps} className="w-full sm:w-auto">
                <Button asChild size="lg" className="w-full justify-center">
                  <Link to="/register">Create an Account</Link>
                </Button>
              </motion.div>
              <motion.div {...buttonMotionProps} className="w-full sm:w-auto">
                <Button asChild size="lg" variant="outline" className="w-full justify-center">
                  <Link to="/login">Sign In</Link>
                </Button>
              </motion.div>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.main>
  )
}

export default Home
