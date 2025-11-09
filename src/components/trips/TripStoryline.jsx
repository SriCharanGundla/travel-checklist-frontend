import { useMemo, useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { CalendarRange, MapPin, Navigation } from 'lucide-react'
import { formatDateRange } from '@/utils/dateUtils'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'
import { cn } from '@/lib/utils'
import { getTripStatusLabel } from '@/constants/tripStatus'

const storylinePlaceholders = [
  {
    id: 'story-placeholder-1',
    name: 'Lisbon reconnaissance',
    destination: 'Lisbon, Portugal',
    startDate: '2025-03-14',
    endDate: '2025-03-21',
    status: 'planning',
  },
  {
    id: 'story-placeholder-2',
    name: 'Tokyo spring sprint',
    destination: 'Tokyo, Japan',
    startDate: '2025-04-05',
    endDate: '2025-04-15',
    status: 'confirmed',
  },
  {
    id: 'story-placeholder-3',
    name: 'Patagonia trek',
    destination: 'El Chaltén, Argentina',
    startDate: '2025-06-01',
    endDate: '2025-06-12',
    status: 'ongoing',
  },
]

const statusAccentMap = {
  planning: 'from-sky-400/30 to-blue-500/10 text-sky-100',
  confirmed: 'from-emerald-400/40 to-emerald-500/10 text-emerald-100',
  ongoing: 'from-amber-400/40 to-orange-500/10 text-amber-100',
  completed: 'from-slate-400/30 to-slate-600/10 text-slate-100',
  cancelled: 'from-rose-500/35 to-rose-600/20 text-rose-100',
}

const TripStoryline = ({ trips = [], isLoading }) => {
  const { prefersReducedMotion } = useAnimationSettings()
  const storylineTrips = useMemo(
    () => (trips.length ? trips.slice(0, 4) : storylinePlaceholders),
    [trips],
  )

  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const motionProgress = useSpring(scrollYProgress, {
    stiffness: prefersReducedMotion ? 400 : 140,
    damping: prefersReducedMotion ? 38 : 24,
    mass: 0.6,
  })

  const gradientShift = useTransform(motionProgress, [0, 1], ['-10%', '35%'])
  const backgroundDrift = useTransform(motionProgress, [0, 1], ['0%', '-20%'])
  const timelineLength = useTransform(motionProgress, [0, 1], ['12%', '88%'])

  const showSkeleton = isLoading && !trips.length

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg shadow-primary/10 backdrop-blur lg:p-10"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-sky-500/10 to-emerald-400/10 blur-3xl"
        style={prefersReducedMotion ? undefined : { x: gradientShift }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[36px] border border-primary/20"
        style={prefersReducedMotion ? undefined : { y: backgroundDrift }}
      />

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Storyline</p>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Upcoming journey choreography</h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Scroll to preview how each itinerary flows into the next. Motion layers mirror your Lenis scroll
              and highlight status shifts so the team knows what is planning, launching, or in the field.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2">
              <Navigation className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Lenis-guided smooth scroll
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2">
              <CalendarRange className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              Morph-safe timelines
            </div>
          </div>
        </div>

        <div className={cn('relative flex-[1.2]', !prefersReducedMotion && 'lg:sticky lg:top-12')}>
          {showSkeleton ? (
            <StorylineSkeleton />
          ) : (
            <div className="relative pl-6">
              <motion.span
                aria-hidden
                className="absolute left-[14px] top-6 w-px rounded-full bg-gradient-to-b from-primary/40 via-primary/60 to-primary/10"
                style={prefersReducedMotion ? undefined : { height: timelineLength }}
              />
              <ol className="space-y-6">
                {storylineTrips.map((trip, index) => (
                  <TripStorylineCard
                    key={trip.id || `storyline-${index}`}
                    trip={trip}
                    index={index}
                    progress={motionProgress}
                    prefersReducedMotion={prefersReducedMotion}
                  />
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function TripStorylineCard({ trip, index, progress, prefersReducedMotion }) {
  const startWindow = Math.min(1, index * 0.15)
  const endWindow = Math.min(1, startWindow + 0.7)

  const translateY = useTransform(progress, [startWindow, endWindow], [30, -12])
  const opacity = useTransform(progress, [startWindow, endWindow], [0.4, 1])
  const scale = useTransform(progress, [startWindow, endWindow], [0.94, 1])

  const accentClass = statusAccentMap[trip.status] || 'from-white/10 to-white/5 text-slate-100'

  const cardStyle = prefersReducedMotion
    ? undefined
    : {
        y: translateY,
        opacity,
        scale,
      }

  return (
    <motion.li
      style={cardStyle}
      className="relative rounded-2xl border border-border/50 bg-background/90 p-4 shadow-lg shadow-primary/10 backdrop-blur"
    >
      <div className="absolute left-[-22px] top-6 flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-background text-xs font-semibold text-primary">
        {index + 1}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {getTripStatusLabel(trip.status)}
          </p>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium', `bg-gradient-to-r ${accentClass}`)}>
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" aria-hidden="true" />
            {trip.destination || 'Unassigned destination'}
          </span>
        </div>
        <div>
          <p className="text-xl font-semibold text-foreground">{trip.name || 'Untitled trip'}</p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {trip.destination || 'Destination pending'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
            {formatDateRange(trip.startDate, trip.endDate) || 'TBD window'}
          </span>
        </div>
      </div>
    </motion.li>
  )
}

function StorylineSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={`storyline-skeleton-${item}`} className="rounded-2xl border border-border/40 bg-background/60 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <Skeleton className="mb-2 h-5 w-48 rounded-md" />
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export default TripStoryline
