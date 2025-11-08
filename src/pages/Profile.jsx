import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { maskEmail } from '../utils/privacy'
import { TravelerDirectoryManager } from '../components/profile/TravelerDirectoryManager'

const Profile = () => {
  const { user } = useAuth()
  const location = useLocation()
  const directoryRef = useRef(null)

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
      </div>

      <div ref={directoryRef}>
        <TravelerDirectoryManager />
      </div>
    </div>
  )
}

export default Profile
