import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'
import authService from '../services/authService'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
})

const ForgotPassword = () => {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await authService.requestPasswordReset(values)
      toast.success('If we find a matching account, password reset instructions will arrive shortly.')
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'We could not process that request right now. Please try again.'
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-6 py-12">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden pt-0 shadow-lg">
          <CardHeader className="space-y-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-6">
            <CardTitle className="text-2xl font-semibold text-foreground">Reset your password</CardTitle>
            <CardDescription className="text-sm">
              Enter the email address associated with your account. We&apos;ll send a link to create a new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9"
                    placeholder="you@example.com"
                    {...register('email')}
                  />
                </div>
                {errors.email ? (
                  <p className="mt-1 text-xs font-medium text-destructive">{errors.email.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending instructions…' : 'Send reset link'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword
