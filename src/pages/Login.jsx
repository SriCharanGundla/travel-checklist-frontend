import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { SensitiveInput } from '../components/ui/sensitiveInput'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
})

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading } = useAuth()

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await login(values)
      const fromLocation = location.state?.from
      const redirectTo = fromLocation
        ? `${fromLocation.pathname}${fromLocation.search || ''}`
        : '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Could not sign in. Check your credentials.'
      toast.error(message)
    }
  }

  const renderError = (fieldError) =>
    fieldError ? <p className="mt-1 text-xs font-medium text-destructive">{fieldError.message}</p> : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden pt-0 shadow-lg">
          <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-6">
            <div>
              <CardTitle className="text-2xl font-semibold text-foreground">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Sign in to continue planning, coordinating, and checking off your travel essentials.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" className="pl-9" {...register('email')} />
                </div>
                {renderError(errors.email)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <SensitiveInput
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  leadingIcon={Lock}
                  {...register('password')}
                />
                {renderError(errors.password)}
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:text-primary/80">
                  Forgot your password?
                </Link>
              </div>

              <Button type="submit" disabled={isSubmitting || loading} className="w-full">
                {isSubmitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <span className="mr-1 font-medium text-foreground">Tip:</span> Use the same credentials across web and mobile once
              the companion app launches.
            </div>

            <p className="text-center text-sm text-muted-foreground">
              No account yet?{' '}
              <Link to="/register" className="font-semibold text-primary hover:text-primary/80">
                Create one now
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
