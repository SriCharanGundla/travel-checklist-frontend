import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const navLinkClasses = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
  }`

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="text-lg font-semibold text-gray-900">
              Travel Checklist
            </NavLink>
            <nav className="hidden items-center gap-2 sm:flex">
              <NavLink to="/dashboard" className={navLinkClasses} end>
                Dashboard
              </NavLink>
              <NavLink to="/trips" className={navLinkClasses}>
                Trips
              </NavLink>
              <NavLink to="/trips/new" className={navLinkClasses}>
                New Trip
              </NavLink>
              <NavLink to="/profile" className={navLinkClasses}>
                Profile
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-gray-600 sm:inline">
              {user?.firstName ? `Hi, ${user.firstName}` : user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
