import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Lock } from 'lucide-react'
import authService from '../services/authService'
import { Button } from '../components/ui/button'
import { SensitiveInput } from '../components/ui/sensitiveInput'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(64, 'Password must be fewer than 64 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message: 'Password must include upper & lower case, a number, and a symbol',
  })

const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

const ResetPassword = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const token = useMemo(() => params.get('token'), [params])

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values) => {
    if (!token) {
      toast.error('Reset token missing. Please resend the password reset email.')
      return
    }

    try {
      await authService.resetPassword({ token, password: values.password })
      toast.success('Password updated successfully. Sign in with your new credentials.')
      reset()
      navigate('/login', { replace: true })
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        'We could not reset that password. The link might be expired or invalid.'
      toast.error(message)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardTitle className="text-2xl font-semibold text-slate-900">Reset link expired</CardTitle>
              <CardDescription className="text-sm">
                The reset link is missing or invalid. Request a fresh one to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 py-6">
              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
              >
                Send me a new reset link
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <CardTitle className="text-2xl font-semibold text-slate-900">Choose a new password</CardTitle>
            <CardDescription className="text-sm">
              Use at least 8 characters, mixing uppercase, lowercase, numbers, and symbols for the best security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <SensitiveInput
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <SensitiveInput
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.confirmPassword.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Updating password…' : 'Update password'}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600">
              Need help?{' '}
              <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary/80">
                Send a new reset link
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword
