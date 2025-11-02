import { useAuth } from '../contexts/AuthContext'
import { maskEmail } from '../utils/privacy'

const Profile = () => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

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
    </div>
  )
}

export default Profile
