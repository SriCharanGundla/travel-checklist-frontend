import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { SensitiveInput } from '../components/ui/sensitiveInput'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/

const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(64, 'Password must be at most 64 characters')
      .regex(passwordRegex, 'Use upper & lower case letters and a number'),
    confirmPassword: z.string(),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

const Register = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { register: registerUser, loading } = useAuth()

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await registerUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      toast.success('Account ready! You are signed in.')
      const fromLocation = location.state?.from
      const redirectTo = fromLocation
        ? `${fromLocation.pathname}${fromLocation.search || ''}`
        : '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Registration failed. Please try again.'
      toast.error(message)
    }
  }

  const renderError = (fieldError) =>
    fieldError ? <p className="mt-1 text-xs font-medium text-rose-600">{fieldError.message}</p> : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-3xl">
        <Card className="shadow-xl">
          <CardHeader className="grid gap-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent sm:grid-cols-2">
            <div>
              <CardTitle className="text-2xl font-semibold text-slate-900">Create your travel workspace</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Invite collaborators, organize itineraries, track essential documents, and stay ahead of every departure date.
              </CardDescription>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-white/70 p-4 text-sm text-slate-600">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-slate-700">Security-first foundation</p>
                <p>
                  Traveler details and attachments are encrypted before they leave your browser, and secure links expire automatically to keep vault files private.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="py-6">
            <form className="grid grid-cols-1 gap-6 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="firstName" required>
                  First name
                </Label>
                <Input id="firstName" autoComplete="given-name" {...register('firstName')} />
                {renderError(errors.firstName)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" required>
                  Last name
                </Label>
                <Input id="lastName" autoComplete="family-name" {...register('lastName')} />
                {renderError(errors.lastName)}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email" required>
                  Email address
                </Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
                {renderError(errors.email)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" required>
                  Password
                </Label>
                <SensitiveInput
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {renderError(errors.password)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" required>
                  Confirm password
                </Label>
                <SensitiveInput
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                {renderError(errors.confirmPassword)}
              </div>

              <div className="md:col-span-2 space-y-4">
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || loading}>
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : (
                    'Create account'
                  )}
                </Button>
                <p className="text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register
