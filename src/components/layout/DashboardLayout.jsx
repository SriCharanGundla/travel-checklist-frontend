import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { Button, buttonVariants } from '../ui/button'
import { cn } from '../../lib/utils'

const navLinkClasses = ({ isActive }) =>
  cn(
    buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }),
    'font-semibold',
    isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-900',
  )

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <NavLink to="/dashboard" className="text-lg font-semibold text-slate-900">
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
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">
              {user?.firstName ? `Hi, ${user.firstName}` : user?.email}
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
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
