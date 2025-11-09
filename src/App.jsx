import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TripList from './pages/TripList'
import TripDetail from './pages/TripDetail'
import CreateTrip from './pages/CreateTrip'
import SharedTrip from './pages/SharedTrip'
import AcceptInvite from './pages/AcceptInvite'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import ThemeToggle from './components/common/ThemeToggle'
import MotionToggle from './components/common/MotionToggle'

const RootLayout = () => (
  <>
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
      <MotionToggle />
      <ThemeToggle />
    </div>
    <Toaster />
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-background text-foreground focus:outline-none"
    >
      <Outlet />
    </main>
  </>
)

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'login', element: <Login /> },
        { path: 'register', element: <Register /> },
        { path: 'forgot-password', element: <ForgotPassword /> },
        { path: 'reset-password', element: <ResetPassword /> },
        { path: 'accept-invite', element: <AcceptInvite /> },
        { path: 'shared/:token', element: <SharedTrip /> },
        {
          element: <ProtectedRoute />,
          children: [
            {
              element: <DashboardLayout />,
              children: [
                { path: 'dashboard', element: <Dashboard /> },
                { path: 'trips', element: <TripList /> },
                { path: 'trips/new', element: <CreateTrip /> },
                { path: 'trips/:tripId', element: <TripDetail /> },
                { path: 'profile', element: <Profile /> },
              ],
            },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true, v7_relativeSplatPath: true }} />
    </AuthProvider>
  )
}

export default App
