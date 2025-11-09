import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { maskEmail } from '../utils/privacy'
import { TravelerDirectoryManager } from '../components/profile/TravelerDirectoryManager'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useAnimationSettings } from '@/contexts/AnimationSettingsContext.jsx'

const Profile = () => {
  const { user } = useAuth()
  const location = useLocation()
  const directoryRef = useRef(null)
  const { prefersReducedMotion, userMotionPreference, setReducedMotionPreference } = useAnimationSettings()

  const reduceMotionEnabled =
    userMotionPreference === 'reduced' ||
    (userMotionPreference === 'system' && prefersReducedMotion)

  const preferenceLabel =
    userMotionPreference === 'system'
      ? 'Following system preference'
      : userMotionPreference === 'reduced'
        ? 'Always minimizing animations'
        : 'Animations forced on'

  useEffect(() => {
    if (!user) {
      return
    }

    if (location.hash === '#travelers' && directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [user, location.hash])

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Full name</h2>
          <p className="mt-2 text-base text-foreground">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not provided'}
          </p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Email</h2>
          <p className="mt-2 text-base text-foreground">{maskEmail(user.email)}</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Timezone</h2>
          <p className="mt-2 text-base text-foreground">{user.timezone || 'Not set yet'}</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Role</h2>
          <p className="mt-2 text-base text-foreground capitalize">{user.role}</p>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm md:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Reduce motion
              </h2>
              <p className="mt-2 text-base text-foreground">
                Toggle subtle animations across the product if motion makes you uncomfortable.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{preferenceLabel}</p>
            </div>
            <Switch
              checked={reduceMotionEnabled}
              onCheckedChange={(checked) => setReducedMotionPreference(checked ? 'reduced' : 'motion')}
              aria-label="Toggle reduced motion"
            />
          </div>
          {userMotionPreference !== 'system' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 px-0 text-primary hover:text-primary"
              onClick={() => setReducedMotionPreference('system')}
            >
              Use system preference
            </Button>
          )}
        </div>
      </div>

      <div ref={directoryRef}>
        <TravelerDirectoryManager />
      </div>
    </div>
  )
}

export default Profile
