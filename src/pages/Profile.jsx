import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { maskEmail } from '../utils/privacy'
import { TravelerDirectoryManager } from '../components/profile/TravelerDirectoryManager'

const Profile = () => {
  const { user } = useAuth()
  const location = useLocation()
  const directoryRef = useRef(null)

  if (!user) {
    return null
  }

  useEffect(() => {
    if (location.hash === '#travelers' && directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-600">Manage your account information and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Full name</h2>
          <p className="mt-2 text-base text-gray-900">
            {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Not provided'}
          </p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Email</h2>
          <p className="mt-2 text-base text-gray-900">{maskEmail(user.email)}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Timezone</h2>
          <p className="mt-2 text-base text-gray-900">{user.timezone || 'Not set yet'}</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Role</h2>
          <p className="mt-2 text-base text-gray-900 capitalize">{user.role}</p>
        </div>
      </div>

      <div ref={directoryRef}>
        <TravelerDirectoryManager />
      </div>
    </div>
  )
}

export default Profile
