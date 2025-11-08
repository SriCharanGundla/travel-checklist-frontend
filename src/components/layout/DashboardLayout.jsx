import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button, buttonVariants } from '../ui/button'
import { cn } from '../../lib/utils'
import { maskEmail } from '../../utils/privacy'

const navLinkClasses = ({ isActive }) =>
  cn(
    buttonVariants({ variant: isActive ? 'default' : 'ghost', size: 'sm' }),
    'font-semibold',
    isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
  )

const DashboardLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isNavOpen, setIsNavOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    setIsNavOpen(false)
  }, [location.pathname])

  const toggleNavigation = () => {
    setIsNavOpen((prev) => !prev)
  }

  return (
    <>
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <NavLink to="/dashboard" className="text-lg font-semibold text-foreground">
              Travel Checklist
            </NavLink>
            <button
              type="button"
              onClick={toggleNavigation}
              className="inline-flex items-center justify-center rounded-md border border-border p-2 text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:hidden"
              aria-expanded={isNavOpen}
              aria-controls="dashboard-navigation"
            >
              <span className="sr-only">Toggle navigation</span>
              {isNavOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
            <nav
              id="dashboard-navigation"
              aria-label="Primary"
              className={cn(
                'mt-3 w-full flex-col gap-2 border-t border-border pt-3 sm:mt-0 sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:border-0 sm:pt-0',
                isNavOpen ? 'flex' : 'hidden sm:flex'
              )}
            >
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
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {user?.firstName ? `Hi, ${user.firstName}` : maskEmail(user?.email)}
            </span>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </div>
    </>
  )
}

export default DashboardLayout
