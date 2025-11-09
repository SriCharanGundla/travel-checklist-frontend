import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'motion/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Circle, CircleDot, Loader2, ShieldCheck } from 'lucide-react'
import { durationSeconds, easingCurves } from '@/lib/animation'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { SensitiveInput } from '../components/ui/sensitiveInput'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must be at most 64 characters')
      .regex(passwordRegex, 'Use upper & lower case letters and a number'),
    confirmPassword: z.string(),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

const fieldVariants = {
  idle: { boxShadow: '0 0 0 0 hsl(var(--border))', scale: 1 },
  active: { boxShadow: '0 0 0 2px hsl(var(--ring) / 0.35)', scale: 1.01 },
  complete: { boxShadow: '0 0 0 3px hsl(var(--primary) / 0.35)', scale: 1.005 },
  error: { boxShadow: '0 0 0 3px hsl(var(--destructive) / 0.4)', scale: 1 },
}

const fieldTransition = {
  duration: durationSeconds.fast,
  ease: easingCurves.out.motion,
}

const trackerCardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durationSeconds.base,
      ease: easingCurves.standard.motion,
      staggerChildren: durationSeconds.fast / 2,
    },
  },
}

const trackerItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durationSeconds.fast,
      ease: easingCurves.out.motion,
    },
  },
}

const STEP_STATUS_LABEL = {
  complete: 'Complete',
  current: 'In progress',
  upcoming: 'Pending',
}

const celebrationDurationMs = 1600
const confettiColors = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#f97316', '#facc15']

const hasValue = (value) => Boolean(value?.trim().length)

const getFieldState = (value, hasError, isDirty) => {
  if (hasError) {
    return 'error'
  }
  if (hasValue(value) && !hasError) {
    return 'complete'
  }
  if (isDirty) {
    return 'active'
  }
  return 'idle'
}

const getStepStatus = ({ complete, active }) => {
  if (complete) {
    return 'complete'
  }
  if (active) {
    return 'current'
  }
  return 'upcoming'
}

const StepStatusIcon = ({ status }) => {
  if (status === 'complete') {
    return <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
  }
  if (status === 'current') {
    return <CircleDot className="h-5 w-5 text-primary" aria-hidden="true" />
  }
  return <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
}

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser, loading } = useAuth()
  const { prefersReducedMotion } = useAnimationSettings()

  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const [celebrationVisible, setCelebrationVisible] = useState(false)
  const celebrationTimeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current)
      }
    }
  }, [])

  const [firstNameValue, lastNameValue, emailValue, passwordValue, confirmPasswordValue] = watch([
    'firstName',
    'lastName',
    'email',
    'password',
    'confirmPassword',
  ])

  const fieldValues = {
    firstName: firstNameValue || '',
    lastName: lastNameValue || '',
    email: emailValue || '',
    password: passwordValue || '',
    confirmPassword: confirmPasswordValue || '',
  }

  const fieldStates = {
    firstName: getFieldState(fieldValues.firstName, Boolean(errors.firstName), Boolean(dirtyFields.firstName)),
    lastName: getFieldState(fieldValues.lastName, Boolean(errors.lastName), Boolean(dirtyFields.lastName)),
    email: getFieldState(fieldValues.email, Boolean(errors.email), Boolean(dirtyFields.email)),
    password: getFieldState(fieldValues.password, Boolean(errors.password), Boolean(dirtyFields.password)),
    confirmPassword: getFieldState(
      fieldValues.confirmPassword,
      Boolean(errors.confirmPassword),
      Boolean(dirtyFields.confirmPassword),
    ),
  }

  const profileComplete = ['firstName', 'lastName', 'email'].every(
    (field) => hasValue(fieldValues[field]) && !errors[field],
  )
  const profileActive =
    !profileComplete &&
    ['firstName', 'lastName', 'email'].some(
      (field) => Boolean(dirtyFields[field]) || hasValue(fieldValues[field]) || Boolean(errors[field]),
    )

  const passwordComplete = ['password', 'confirmPassword'].every(
    (field) => hasValue(fieldValues[field]) && !errors[field],
  )
  const passwordActive =
    !passwordComplete &&
    ['password', 'confirmPassword'].some(
      (field) => Boolean(dirtyFields[field]) || hasValue(fieldValues[field]) || Boolean(errors[field]),
    )

  const inviteReady = profileComplete && passwordComplete

  const onboardingSteps = [
    {
      id: 'profile',
      title: 'Profile details',
      description: 'First name, last name, and email',
      status: getStepStatus({ complete: profileComplete, active: profileActive }),
    },
    {
      id: 'workspace-security',
      title: 'Secure workspace',
      description: 'Password & confirmation requirements',
      status: getStepStatus({ complete: passwordComplete, active: passwordActive }),
    },
    {
      id: 'invite-team',
      title: 'Invite collaborators',
      description: 'Send invites right after sign-up',
      status: getStepStatus({ complete: false, active: inviteReady }),
    },
  ]

  const completedSteps = onboardingSteps.filter((step) => step.status === 'complete').length

  const confettiPieces = useMemo(() => {
    if (prefersReducedMotion) {
      return []
    }
    return Array.from({ length: 16 }, (_, index) => {
      const direction = index % 2 === 0 ? -1 : 1
      return {
        id: index,
        delay: index * 0.05,
        color: confettiColors[index % confettiColors.length],
        x: direction * (30 + index * 3),
        y: -80 - index * 6,
        rotate: direction * (10 + index * 1.5),
        duration: 0.85 + (index % 4) * 0.08,
      }
    })
  }, [prefersReducedMotion])

  const trackerMotionProps = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden',
        animate: 'visible',
        variants: trackerCardVariants,
      }

  const trackerItemMotionProps = prefersReducedMotion ? {} : { variants: trackerItemVariants }

  const buildFieldMotionProps = (state) =>
    prefersReducedMotion
      ? {}
      : {
          variants: fieldVariants,
          animate: state,
          initial: false,
          transition: fieldTransition,
        }

  const triggerCelebration = (onComplete) => {
    if (celebrationTimeoutRef.current) {
      clearTimeout(celebrationTimeoutRef.current)
    }
    setCelebrationVisible(true)
    celebrationTimeoutRef.current = setTimeout(() => {
      setCelebrationVisible(false)
      onComplete()
    }, celebrationDurationMs)
  }

  const onSubmit = async (values) => {
    try {
      await registerUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      toast.success('Account ready! You are signed in.')
      const fromLocation = location.state?.from
      const redirectTo = fromLocation
        ? `${fromLocation.pathname}${fromLocation.search || ''}`
        : '/dashboard'
      const finishNavigation = () => navigate(redirectTo, { replace: true })

      if (prefersReducedMotion) {
        finishNavigation()
      } else {
        triggerCelebration(finishNavigation)
      }
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed. Please try again.'
      toast.error(message)
    }
  }

  const renderError = (fieldError) =>
    fieldError ? <p className="mt-1 text-xs font-medium text-destructive">{fieldError.message}</p> : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6 py-12">
      <div className="w-full max-w-3xl">
        <Card className="relative overflow-hidden pt-0 shadow-xl">
          <AnimatePresence>
            {celebrationVisible && (
              <motion.div
                data-testid="register-celebration"
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 px-6 text-center backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: durationSeconds.fast, ease: easingCurves.standard.motion }}
              >
                {!prefersReducedMotion && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {confettiPieces.map((piece) => (
                      <motion.span
                        key={piece.id}
                        className="absolute h-2 w-2 rounded-sm"
                        style={{ left: '50%', top: '55%', backgroundColor: piece.color }}
                        initial={{ opacity: 0, x: 0, y: 0, scale: 0.85 }}
                        animate={{ opacity: [0, 1, 0], x: piece.x, y: piece.y, rotate: piece.rotate, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeOut' }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ duration: durationSeconds.base, ease: easingCurves.emphasized.motion }}
                  className="relative flex flex-col items-center"
                >
                  <motion.div
                    initial={{ rotate: -6, scale: 0.85 }}
                    animate={{ rotate: [0, -3, 0], scale: [1, 1.07, 1] }}
                    transition={{ duration: durationSeconds.relaxed, ease: easingCurves.emphasized.motion }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner"
                  >
                    <CheckCircle2 className="h-12 w-12" aria-hidden="true" />
                  </motion.div>
                  <p className="mt-4 text-xl font-semibold text-foreground">Workspace ready!</p>
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    Redirecting to your dashboard…
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <CardHeader className="grid gap-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-6 sm:grid-cols-2">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">Create your travel workspace</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Invite collaborators, organize itineraries, track essential documents, and stay ahead of every departure date.
              </CardDescription>
            </div>
            <div className="space-y-4">
              <motion.div
                className="rounded-xl border border-primary/30 bg-background/80 p-4 text-sm shadow-sm backdrop-blur"
                {...trackerMotionProps}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Workspace setup</span>
                  <span>
                    {completedSteps}/{onboardingSteps.length} complete
                  </span>
                </div>
                <ol className="mt-4 space-y-4">
                  {onboardingSteps.map((step, index) => {
                    const isLast = index === onboardingSteps.length - 1
                    const statusLabel = STEP_STATUS_LABEL[step.status]
                    return (
                      <motion.li key={step.id} className="flex gap-3" {...trackerItemMotionProps}>
                        <div className="flex flex-col items-center text-muted-foreground">
                          <StepStatusIcon status={step.status} />
                          {!isLast && <span className="mt-1 min-h-[16px] w-px flex-1 rounded-full bg-border" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{step.title}</p>
                            <span
                              data-testid={`tracker-status-${step.id}`}
                              className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                        </div>
                      </motion.li>
                    )
                  })}
                </ol>
              </motion.div>

              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-card/70 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-foreground">Security-first foundation</p>
                  <p>
                    Traveler details and attachments are encrypted before they leave your browser, and secure links expire automatically to keep vault files private.
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="py-6">
            <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
              <motion.div className="space-y-2 rounded-xl" {...buildFieldMotionProps(fieldStates.firstName)}>
                <Label htmlFor="firstName" required>
                  First name
                </Label>
                <Input id="firstName" autoComplete="given-name" {...register('firstName')} />
                {renderError(errors.firstName)}
              </motion.div>

              <motion.div className="space-y-2 rounded-xl" {...buildFieldMotionProps(fieldStates.lastName)}>
                <Label htmlFor="lastName" required>
                  Last name
                </Label>
                <Input id="lastName" autoComplete="family-name" {...register('lastName')} />
                {renderError(errors.lastName)}
              </motion.div>

              <motion.div className="space-y-2 rounded-xl md:col-span-2" {...buildFieldMotionProps(fieldStates.email)}>
                <Label htmlFor="email" required>
                  Email address
                </Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
                {renderError(errors.email)}
              </motion.div>

              <motion.div className="space-y-2 rounded-xl" {...buildFieldMotionProps(fieldStates.password)}>
                <Label htmlFor="password" required>
                  Password
                </Label>
                <SensitiveInput
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {renderError(errors.password)}
              </motion.div>

              <motion.div className="space-y-2 rounded-xl" {...buildFieldMotionProps(fieldStates.confirmPassword)}>
                <Label htmlFor="confirmPassword" required>
                  Confirm password
                </Label>
                <SensitiveInput
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                {renderError(errors.confirmPassword)}
              </motion.div>

              <div className="md:col-span-2 space-y-4">
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || loading}>
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register
