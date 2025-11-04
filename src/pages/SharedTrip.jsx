import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Textarea } from '../components/ui/textarea'
import shareLinkService from '../services/shareLinkService'
import { formatDate, formatDateRange, formatDateTime, formatRelativeDate } from '../utils/dateUtils'
import { DatePicker, DateTimePicker } from '../components/ui/date-picker'

const itineraryTypeLabels = {
  flight: 'Flight',
  accommodation: 'Accommodation',
  activity: 'Activity',
  restaurant: 'Dining',
  transport: 'Transport',
}

const expenseCategoryLabels = {
  accommodation: 'Accommodation',
  transport: 'Transport',
  food: 'Food & Dining',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
}

const defaultItineraryForm = {
  type: 'activity',
  title: '',
  provider: '',
  startTime: '',
  endTime: '',
  location: '',
  notes: '',
  bookingReference: '',
}

const defaultExpenseForm = {
  category: 'other',
  amount: '',
  currency: 'USD',
  spentAt: '',
  merchant: '',
  notes: '',
}

const formatCurrency = (amount, currency) => {
  if (amount === null || amount === undefined) return '—'
  const numeric = Number(amount)
  if (!Number.isFinite(numeric)) return '—'
  const code = (currency || 'USD').toUpperCase()
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(numeric)
  } catch (error) {
    return `${code} ${numeric.toFixed(2)}`
  }
}

const pruneEmpty = (payload) =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return acc
    }
    acc[key] = value
    return acc
  }, {})

const SharedTrip = () => {
  const { token } = useParams()
  const location = useLocation()
  const [shareLink, setShareLink] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [itineraryForm, setItineraryForm] = useState(defaultItineraryForm)
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm)
  const [isSubmittingItinerary, setIsSubmittingItinerary] = useState(false)
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false)

  useEffect(() => {
    const fetchShareLink = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await shareLinkService.getShareLinkByToken(token)
        setShareLink(data)
        setExpenseForm((prev) => ({
          ...prev,
          currency: data?.trip?.budgetCurrency || prev.currency || 'USD',
        }))
      } catch (err) {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          setError({
            type: 'auth',
            title: 'Join this trip',
            description:
              'Sign in or create an account using the same email address where you received the invite. You’ll be added automatically afterwards.',
          })
        } else {
          const message = err.response?.data?.error?.message || 'This share link is not available.'
          setError({
            type: 'generic',
            title: 'Share link unavailable',
            description: message,
          })
        }
        setShareLink(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShareLink()
  }, [token])

  useEffect(() => {
    if (!shareLink?.trip?.budgetCurrency) return
    setExpenseForm((prev) => {
      if (prev.currency && prev.currency !== 'USD') {
        return prev
      }
      return { ...prev, currency: shareLink.trip.budgetCurrency }
    })
  }, [shareLink?.trip?.budgetCurrency])

  const trip = shareLink?.trip
  const itineraryItems = shareLink?.itinerary ?? []
  const expenses = shareLink?.expenses?.items ?? []
  const expenseSummary = shareLink?.expenses?.summary ?? {
    totalSpent: 0,
    budgetAmount: trip?.budgetAmount ?? 0,
    currency: trip?.budgetCurrency ?? 'USD',
    remainingBudget: null,
    totalsByCategory: {},
  }
  const categoryTotals = expenseSummary?.totalsByCategory || {}

  const canContribute = Boolean(shareLink?.permissions?.canContribute)
  const allowedActions = shareLink?.allowedActions ?? []
  const canSubmitItinerary = canContribute && allowedActions.includes('itinerary:add')
  const canSubmitExpense = canContribute && allowedActions.includes('expense:add')

  const itineraryGroups = useMemo(() => {
    if (!itineraryItems.length) {
      return []
    }

    const grouped = itineraryItems.reduce((acc, item) => {
      const key = item.startTime ? new Date(item.startTime).toISOString().split('T')[0] : 'unscheduled'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    }, {})

    return Object.entries(grouped)
      .map(([key, items]) => {
        const sortedItems = [...items].sort((a, b) => {
          const aTime = a.startTime ? new Date(a.startTime).getTime() : Number.POSITIVE_INFINITY
          const bTime = b.startTime ? new Date(b.startTime).getTime() : Number.POSITIVE_INFINITY
          return aTime - bTime
        })
        const representative = sortedItems[0]
        const sortValue = key === 'unscheduled'
          ? Number.POSITIVE_INFINITY
          : new Date(representative.startTime || `${key}T00:00:00Z`).getTime()
        return {
          key,
          label: key === 'unscheduled' ? 'Unscheduled' : formatDate(representative.startTime || key),
          sortValue,
          items: sortedItems,
        }
      })
      .sort((a, b) => a.sortValue - b.sortValue)
  }, [itineraryItems])

  const expenseItems = useMemo(() => {
    if (!expenses.length) return []
    return [...expenses].sort((a, b) => {
      const aTime = a.spentAt ? new Date(a.spentAt).getTime() : 0
      const bTime = b.spentAt ? new Date(b.spentAt).getTime() : 0
      return bTime - aTime
    })
  }, [expenses])

  const handleItineraryFormChange = (field) => (event) => {
    setItineraryForm((prev) => ({ ...prev, [field]: event.target.value }))
  }
  const handleItineraryDateChange = (field) => (value) => {
    setItineraryForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleExpenseFormChange = (field) => (event) => {
    setExpenseForm((prev) => ({ ...prev, [field]: event.target.value }))
  }
  const handleExpenseDateChange = (value) => {
    setExpenseForm((prev) => ({ ...prev, spentAt: value }))
  }

  const handleSubmitItinerary = async (event) => {
    event.preventDefault()
    if (!itineraryForm.title.trim()) {
      toast.error('Add a title for the itinerary item before sharing.')
      return
    }

    if (!canSubmitItinerary) {
      toast.error('This share link is view-only. Ask the organizer for contributor access.')
      return
    }

    setIsSubmittingItinerary(true)
    try {
      const payload = pruneEmpty({
        type: itineraryForm.type,
        title: itineraryForm.title.trim(),
        provider: itineraryForm.provider,
        startTime: itineraryForm.startTime,
        endTime: itineraryForm.endTime,
        location: itineraryForm.location,
        notes: itineraryForm.notes,
        bookingReference: itineraryForm.bookingReference,
      })

      const result = await shareLinkService.performShareLinkAction(token, {
        action: 'itinerary:add',
        payload,
      })

      if (result?.shareLink) {
        setShareLink(result.shareLink)
      }
      setItineraryForm(defaultItineraryForm)
      toast.success('Itinerary update shared!')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Unable to add itinerary item right now.'
      toast.error(message)
    } finally {
      setIsSubmittingItinerary(false)
    }
  }

  const handleSubmitExpense = async (event) => {
    event.preventDefault()

    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.error('Enter a positive amount before submitting an expense.')
      return
    }

    if (!canSubmitExpense) {
      toast.error('This share link is view-only. Ask the organizer for contributor access.')
      return
    }

    setIsSubmittingExpense(true)
    try {
      const payload = pruneEmpty({
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        currency: expenseForm.currency,
        spentAt: expenseForm.spentAt,
        merchant: expenseForm.merchant,
        notes: expenseForm.notes,
      })

      const result = await shareLinkService.performShareLinkAction(token, {
        action: 'expense:add',
        payload,
      })

      if (result?.shareLink) {
        setShareLink(result.shareLink)
      }

      setExpenseForm((prev) => ({
        ...defaultExpenseForm,
        currency: prev.currency,
      }))
      toast.success('Expense shared with the group!')
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Unable to add this expense right now.'
      toast.error(message)
    } finally {
      setIsSubmittingExpense(false)
    }
  }

  const tripOverviewFields = useMemo(
    () => [
      { label: 'Destination', value: trip?.destination || 'To be announced' },
      { label: 'Status', value: trip?.status || 'Planning' },
      { label: 'Trip type', value: trip?.type || 'Leisure' },
      { label: 'Trip dates', value: formatDateRange(trip?.startDate, trip?.endDate) },
      {
        label: 'Budget',
        value: formatCurrency(trip?.budgetAmount ?? 0, trip?.budgetCurrency || 'USD'),
      },
      {
        label: 'Description',
        value: trip?.description || 'Stay tuned for the full plan.',
      },
    ],
    [trip]
  )

  return (
    <div className="min-h-screen bg-muted px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : error ? (
          <Card
            className={
              error.type === 'auth'
                ? 'border-primary/40 bg-primary/10'
                : 'border-destructive/40 bg-destructive/15'
            }
          >
            <CardHeader>
              <CardTitle
                className={error.type === 'auth' ? 'text-foreground' : 'text-destructive'}
              >
                {error.title}
              </CardTitle>
              <CardDescription
                className={error.type === 'auth' ? 'text-foreground/80' : 'text-destructive'}
              >
                {error.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error.type === 'auth' ? (
                <div className="flex flex-col gap-4 sm:flex-row">
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
                </div>
              ) : (
                <p className="text-sm text-destructive">
                  Double-check the link or ask the trip organizer to resend your invitation.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-foreground">
                  {trip?.name || 'Shared Trip'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last updated {formatRelativeDate(shareLink?.updatedAt)} · Access level{' '}
                  <Badge variant="outline" className="capitalize">
                    {shareLink?.accessLevel || 'view'}
                  </Badge>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                {shareLink?.label && (
                  <Badge variant="secondary" className="text-sm">
                    {shareLink.label}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  Token usage {shareLink?.usageCount ?? 0}
                  {shareLink?.maxUsages ? ` / ${shareLink.maxUsages}` : ''}
                </p>
                {shareLink?.expiresAt && (
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDateTime(shareLink.expiresAt)}
                  </p>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Trip Snapshot</CardTitle>
                <CardDescription>
                  A quick look at the shared travel plan. Sign in for full collaboration tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tripOverviewFields.map((field) => (
                    <div key={field.label} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {field.label}
                      </p>
                      <p className="mt-2 text-sm text-foreground">{field.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-card">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                <TabsTrigger value="budget">Budget</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome aboard</CardTitle>
                    <CardDescription>
                      Bookmark this page to stay aligned with the trip timeline. You&apos;ll receive live
                      updates whenever the organizer shares new details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {canContribute
                        ? 'You can add quick itinerary ideas or expense notes below. Sign in for checklists, documents, and full collaboration tools.'
                        : 'This shared view is read-only. Request a collaborator invite or ask for a contribute-level link to add updates.'}
                    </p>
                    {!canContribute && (
                      <Button variant="outline" asChild>
                        <a href="/register">Join Travel Checklist</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Budget at a glance</CardTitle>
                    <CardDescription>
                      Track how spending compares to the organizer&apos;s stated budget.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                    <Badge variant="outline" className="text-base">
                      Budget: {formatCurrency(expenseSummary?.budgetAmount ?? trip?.budgetAmount ?? 0, expenseSummary?.currency)}
                    </Badge>
                    <Badge variant="outline" className="text-base">
                      Spent so far: {formatCurrency(expenseSummary?.totalSpent ?? 0, expenseSummary?.currency)}
                    </Badge>
                    {expenseSummary?.remainingBudget !== null && (
                      <Badge
                        variant={expenseSummary.remainingBudget < 0 ? 'danger' : 'info'}
                        className="text-base"
                      >
                        {expenseSummary.remainingBudget < 0 ? 'Over budget' : 'Remaining'}:{' '}
                        {formatCurrency(toMathSafeNumber(expenseSummary.remainingBudget), expenseSummary?.currency)}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-4">
                {canSubmitItinerary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Share an itinerary idea</CardTitle>
                      <CardDescription>Contributors can add draft items for the organizer to review.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitItinerary} className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label htmlFor="shared-itinerary-type" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Type
                          </Label>
                          <Select
                            id="shared-itinerary-type"
                            value={itineraryForm.type}
                            onChange={handleItineraryFormChange('type')}
                          >
                            {Object.entries(itineraryTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="shared-itinerary-title" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Title
                          </Label>
                          <Input
                            id="shared-itinerary-title"
                            placeholder="Dinner cruise, museum visit..."
                            value={itineraryForm.title}
                            onChange={handleItineraryFormChange('title')}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-itinerary-start" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Start time
                          </Label>
                          <DateTimePicker
                            id="shared-itinerary-start"
                            value={itineraryForm.startTime}
                            onChange={handleItineraryDateChange('startTime')}
                            placeholder="Select start time"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-itinerary-end" className="text-xs uppercase tracking-wide text-muted-foreground">
                            End time
                          </Label>
                          <DateTimePicker
                            id="shared-itinerary-end"
                            value={itineraryForm.endTime}
                            onChange={handleItineraryDateChange('endTime')}
                            placeholder="Select end time"
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-itinerary-location" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Location
                          </Label>
                          <Input
                            id="shared-itinerary-location"
                            placeholder="Venue, neighborhood, meeting point"
                            value={itineraryForm.location}
                            onChange={handleItineraryFormChange('location')}
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-itinerary-provider" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Provider / Organizer
                          </Label>
                          <Input
                            id="shared-itinerary-provider"
                            placeholder="Airline, tour company, host"
                            value={itineraryForm.provider}
                            onChange={handleItineraryFormChange('provider')}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="shared-itinerary-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Notes for the organizer
                          </Label>
                          <Textarea
                            id="shared-itinerary-notes"
                            placeholder="Add links, reminders, or context for this idea."
                            value={itineraryForm.notes}
                            onChange={handleItineraryFormChange('notes')}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button type="submit" disabled={isSubmittingItinerary}>
                            {isSubmittingItinerary ? 'Sharing...' : 'Share itinerary idea'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {itineraryGroups.length ? (
                  itineraryGroups.map((group) => (
                    <Card key={group.key}>
                      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">{group.label}</CardTitle>
                          <CardDescription>
                            {group.key === 'unscheduled'
                              ? 'Timing to be confirmed'
                              : `Starting ${formatDateTime(group.items[0].startTime)}`}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs uppercase">
                          {group.items.length} item{group.items.length > 1 ? 's' : ''}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {group.items.map((item) => (
                          <div key={item.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="capitalize">
                                  {itineraryTypeLabels[item.type] || item.type}
                                </Badge>
                                <h3 className="font-semibold text-foreground">{item.title}</h3>
                              </div>
                              {item.location && (
                                <p className="text-xs text-muted-foreground">{item.location}</p>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {item.startTime ? formatDateTime(item.startTime) : 'Timing TBD'}
                              {item.endTime ? ` → ${formatDateTime(item.endTime)}` : ''}
                            </p>
                            {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No itinerary items yet</CardTitle>
                      <CardDescription>
                        The organizer hasn&apos;t published schedule details. Check back soon!
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="budget" className="space-y-4">
                {canSubmitExpense && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Share an expense</CardTitle>
                      <CardDescription>Log purchases so everyone stays aligned on spending.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitExpense} className="grid gap-3 md:grid-cols-4">
                        <div>
                          <Label htmlFor="shared-expense-category" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Category
                          </Label>
                          <Select
                            id="shared-expense-category"
                            value={expenseForm.category}
                            onChange={handleExpenseFormChange('category')}
                          >
                            {Object.entries(expenseCategoryLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="shared-expense-amount" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Amount
                          </Label>
                          <Input
                            id="shared-expense-amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={handleExpenseFormChange('amount')}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-expense-currency" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Currency
                          </Label>
                          <Input
                            id="shared-expense-currency"
                            value={expenseForm.currency}
                            maxLength={3}
                            onChange={(event) =>
                              setExpenseForm((prev) => ({
                                ...prev,
                                currency: event.target.value.toUpperCase().slice(0, 3),
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="shared-expense-date" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Date
                          </Label>
                          <DatePicker
                            id="shared-expense-date"
                            value={expenseForm.spentAt}
                            onChange={handleExpenseDateChange}
                            placeholder="Select date"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="shared-expense-merchant" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Merchant
                          </Label>
                          <Input
                            id="shared-expense-merchant"
                            placeholder="Restaurant, airline, booking platform..."
                            value={expenseForm.merchant}
                            onChange={handleExpenseFormChange('merchant')}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label htmlFor="shared-expense-notes" className="text-xs uppercase tracking-wide text-muted-foreground">
                            Notes
                          </Label>
                          <Textarea
                            id="shared-expense-notes"
                            placeholder="Add details such as who covered the cost or reimbursement notes."
                            value={expenseForm.notes}
                            onChange={handleExpenseFormChange('notes')}
                            rows={3}
                          />
                        </div>
                        <div className="md:col-span-4 flex justify-end">
                          <Button type="submit" disabled={isSubmittingExpense}>
                            {isSubmittingExpense ? 'Sharing...' : 'Share expense'}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">Spending summary</CardTitle>
                      <CardDescription>
                        Category breakdown for everyone using this link.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase">
                      {formatCurrency(expenseSummary?.totalSpent ?? 0, expenseSummary?.currency)} spent
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(categoryTotals).length ? (
                        Object.entries(categoryTotals).map(([category, amount]) => (
                          <Badge key={category} variant="secondary" className="capitalize">
                            {expenseCategoryLabels[category] || category}: {formatCurrency(amount, expenseSummary?.currency)}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No expenses shared yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {expenseItems.length ? (
                  expenseItems.map((expense) => (
                    <Card key={expense.id}>
                      <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(expense.amount, expense.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {expenseCategoryLabels[expense.category] || expense.category}
                            {expense.spentAt ? ` • ${formatDate(expense.spentAt)}` : ''}
                          </p>
                          {expense.notes && (
                            <p className="text-xs text-muted-foreground">{expense.notes}</p>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground text-right sm:text-left">
                          {expense.merchant || 'Merchant TBD'}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>No expenses recorded yet</CardTitle>
                      <CardDescription>
                        Share the first expense above so the group can track spending.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="access">
                <Card>
                  <CardHeader>
                    <CardTitle>Share link activity</CardTitle>
                    <CardDescription>Keep this token private to maintain trip security.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Share token
                      </p>
                      <p className="mt-2 break-all text-sm font-mono text-foreground">{token}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDateTime(shareLink?.createdAt)} ·
                      {shareLink?.revokedAt ? ` Revoked ${formatDateTime(shareLink.revokedAt)}` : ' Active'}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

const toMathSafeNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export default SharedTrip
