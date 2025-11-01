import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-16 text-center">
      <div className="max-w-2xl space-y-6">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Travel Checklist
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Plan smarter, travel lighter.
        </h1>
        <p className="text-lg text-gray-600">
          Organize documents, itineraries, budgets, and checklists in one collaborative workspace. Stay ready for every international trip.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Create an Account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
