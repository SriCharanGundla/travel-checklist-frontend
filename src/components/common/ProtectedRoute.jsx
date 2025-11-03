import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm font-medium text-muted-foreground">Preparing your travel dashboard…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
