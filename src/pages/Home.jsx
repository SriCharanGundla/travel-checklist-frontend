import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()

  return (
    <main
      id="landing-content"
      className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-6 py-16 text-center"
      aria-labelledby="landing-title"
    >
      <div className="max-w-2xl space-y-6">
        <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
          Travel Checklist
        </span>
        <h1 id="landing-title" className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Plan smarter, travel lighter.
        </h1>
        <p className="text-lg text-muted-foreground">
          Organize documents, itineraries, budgets, and checklists in one collaborative workspace. Stay ready for every international trip.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {user ? (
            <Button asChild size="lg" className="justify-center">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="justify-center">
                <Link to="/register">Create an Account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="justify-center">
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default Home
