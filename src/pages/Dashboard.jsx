import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName || 'Traveler'}!</h1>
        <p className="mt-2 text-sm text-gray-600">
          Track upcoming trips, see recent changes, and jump into your checklists.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/trips/new"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Plan a New Trip
          </Link>
          <Link
            to="/trips"
            className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View All Trips
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Trips</h2>
          <p className="mt-2 text-sm text-gray-600">Trips starting soon will appear here after you add them.</p>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-2 text-sm text-gray-600">Checklist updates, collaborator invites, and other events will live here.</p>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
