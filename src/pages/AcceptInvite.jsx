import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuth, ACCEPTED_INVITE_STORAGE_KEY } from '../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const INVITE_STORAGE_KEY = 'pendingInviteToken'

const AcceptInvite = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, loading: authLoading, processInviteToken, inviteState } = useAuth()

  const inviteToken = useMemo(() => {
    const raw = searchParams.get('token')
    if (!raw) return ''
    return raw.trim()
  }, [searchParams])

  const [status, setStatus] = useState(inviteToken ? 'idle' : 'missing-token')
  const [error, setError] = useState('')
  const [acceptedTrip, setAcceptedTrip] = useState(null)

  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem(INVITE_STORAGE_KEY, inviteToken)
    }
  }, [inviteToken])

  useEffect(() => {
    if (!inviteToken || authLoading) {
      return
    }

    if (!user) {
      setStatus('need-auth')
      return
    }

    const activeInvite = inviteState?.token === inviteToken ? inviteState : null
    if (activeInvite) {
      if (activeInvite.status === 'processing') {
        setStatus('processing')
        return
      }
      if (activeInvite.status === 'success') {
        setAcceptedTrip(activeInvite.collaborator?.trip || null)
        setStatus('success')
        localStorage.removeItem(ACCEPTED_INVITE_STORAGE_KEY)
        return
      }
      if (activeInvite.status === 'already-member') {
        setAcceptedTrip(activeInvite.collaborator?.trip || null)
        setStatus('already-member')
        localStorage.removeItem(ACCEPTED_INVITE_STORAGE_KEY)
        return
      }
      if (activeInvite.status === 'error') {
        setError(activeInvite.error || 'Unable to accept invitation.')
        setStatus('error')
        return
      }
    }

    let snapshot = null
    try {
      const raw = localStorage.getItem(ACCEPTED_INVITE_STORAGE_KEY)
      snapshot = raw ? JSON.parse(raw) : null
    } catch (err) {
      console.warn('Unable to read accepted invite snapshot', err)
      snapshot = null
    }
    if (snapshot?.token === inviteToken) {
      setAcceptedTrip(snapshot?.collaborator?.trip || null)
      setStatus('success')
      localStorage.removeItem(ACCEPTED_INVITE_STORAGE_KEY)
      return
    }

    let cancelled = false

    const acceptInvite = async () => {
      setStatus('processing')
      try {
        const collaborator = await processInviteToken(inviteToken, { silent: true })
        if (cancelled) return
        setAcceptedTrip(collaborator?.trip || null)
        setStatus('success')
        localStorage.removeItem(ACCEPTED_INVITE_STORAGE_KEY)
      } catch (err) {
        if (cancelled) return
        const code = err.response?.data?.error?.code
        if (code === 'COLLABORATOR.TOKEN_CONSUMED') {
          setStatus('already-member')
        } else {
          const message = err.response?.data?.error?.message || 'Unable to accept invitation.'
          setError(message)
          setStatus('error')
        }
      }
    }

    acceptInvite()

    return () => {
      cancelled = true
    }
  }, [inviteToken, authLoading, user, processInviteToken, inviteState])

  const handleViewTrip = () => {
    if (acceptedTrip?.id) {
      navigate(`/trips/${acceptedTrip.id}`)
    } else if (acceptedTrip?.tripId) {
      navigate(`/trips/${acceptedTrip.tripId}`)
    } else {
      navigate('/trips')
    }
  }

  const inviteDetails = useMemo(() => {
    if (!acceptedTrip) return null
    const { name, destination, startDate } = acceptedTrip
    return {
      name: name || 'Your new trip',
      destination: destination || 'Destination to be announced',
      startDate,
    }
  }, [acceptedTrip])

  const renderContent = () => {
    if (status === 'missing-token') {
      return (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Invitation link incomplete</CardTitle>
            <CardDescription>The invite token was missing. Ask the organizer to resend the link.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to home
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (status === 'need-auth') {
      return (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Join this trip</CardTitle>
            <CardDescription>
              Sign in or create an account using the same email address where you received the invite.
              You&apos;ll be added automatically afterwards.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to="/login" state={{ from: location }}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/register" state={{ from: location }}>
                Create account
              </Link>
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (status === 'processing' || authLoading) {
      return (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Adding you to the trip…</CardTitle>
            <CardDescription>Just a moment while we activate your access.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            Connecting you to your travel workspace
          </CardContent>
        </Card>
      )
    }

    if (status === 'error') {
      return (
        <Card className="max-w-xl border-destructive/40 bg-destructive/15">
          <CardHeader>
            <CardTitle className="text-destructive">We couldn&apos;t accept this invitation</CardTitle>
            <CardDescription className="text-destructive">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
              Go to dashboard
            </Button>
            <Button asChild className="flex-1">
              <Link to="/trips">View my trips</Link>
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (status === 'success') {
      return (
        <Card className="max-w-2xl border-success/40 bg-success/15">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-success">You&apos;re in!</CardTitle>
              <CardDescription className="text-success">
                {inviteDetails?.name} is now available on your dashboard.
              </CardDescription>
            </div>
            <ShieldCheck className="h-8 w-8 text-success" aria-hidden="true" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={handleViewTrip}>
              Open trip workspace
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (status === 'already-member') {
      return (
        <Card className="max-w-2xl border-success/40 bg-success/15">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-success">You already have access</CardTitle>
              <CardDescription className="text-success">
                This trip is already available on your dashboard. Open it below.
              </CardDescription>
            </div>
            <ShieldCheck className="h-8 w-8 text-success" aria-hidden="true" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={handleViewTrip}>
              Open trip workspace
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      {renderContent()}
    </div>
  )
}

export default AcceptInvite
