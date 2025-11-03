import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2, MapPin, PiggyBank } from 'lucide-react'
import { createTrip } from '../services/tripService'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { statusOptions, typeOptions, tripSchema } from '../utils/tripSchemas'
import { DatePicker } from '../components/ui/date-picker'

const CreateTrip = () => {
  const navigate = useNavigate()

  const {
    handleSubmit,
    register,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      status: 'planning',
      type: 'leisure',
      budgetCurrency: 'USD',
      budgetAmount: '',
      description: '',
      notes: '',
    },
  })

  const onSubmit = async (values) => {
    try {
      await createTrip({
        name: values.name.trim(),
        destination: values.destination ? values.destination : null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        status: values.status,
        type: values.type,
        budgetCurrency: values.budgetCurrency,
        budgetAmount: values.budgetAmount ?? 0,
        description: values.description ? values.description : null,
        notes: values.notes ? values.notes : null,
      })

      toast.success('Trip created successfully')
      navigate('/trips', { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to create trip.'
      toast.error(message)
    }
  }

  const renderError = (fieldError) =>
    fieldError ? <p className="mt-1 text-xs font-medium text-destructive">{fieldError.message}</p> : null

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Create a New Trip</h1>
        <p className="text-sm text-muted-foreground">
          Capture the essentials now and invite travelers later. You can always refine the details as plans evolve.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip overview</CardTitle>
          <CardDescription>Set the high-level details that will appear across checklists and timelines.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name" required>
                  Trip name
                </Label>
                <Input id="name" placeholder="Summer in Lisbon" autoFocus {...register('name')} />
                {renderError(errors.name)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">
                  Primary destination
                </Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="destination" className="pl-9" placeholder="City or region" {...register('destination')} />
                </div>
                {renderError(errors.destination)}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start date</Label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="startDate"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select start date"
                      />
                    )}
                  />
                  {renderError(errors.startDate)}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End date</Label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        id="endDate"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select end date"
                      />
                    )}
                  />
                  {renderError(errors.endDate)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trip status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="status"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Trip type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="type"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetCurrency">Budget currency</Label>
                <Input id="budgetCurrency" className="uppercase" maxLength={3} {...register('budgetCurrency')} />
                {renderError(errors.budgetCurrency)}
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetAmount">
                  Budget amount
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
                    Optional
                  </span>
                </Label>
                <Input id="budgetAmount" type="number" step="0.01" min="0" placeholder="0.00" {...register('budgetAmount')} />
                {renderError(errors.budgetAmount)}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="What is this trip about? Who's going? What are your goals?"
                  {...register('description')}
                />
                {renderError(errors.description)}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">Internal notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Log reminders, visa requirements, or planning to-dos."
                  {...register('notes')}
                />
                {renderError(errors.notes)}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  'Create trip'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateTrip
