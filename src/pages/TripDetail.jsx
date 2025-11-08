import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Label } from '../components/ui/label'
import { cn } from '../lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { TravelersPanel } from '../components/trips/TravelersPanel'
import { ChecklistPanel } from '../components/trips/ChecklistPanel'
import { DocumentsPanel } from '../components/trips/DocumentsPanel'
import { CollaboratorsPanel } from '../components/trips/CollaboratorsPanel'
import { ItineraryPanel } from '../components/trips/ItineraryPanel'
import { ExpensesPanel } from '../components/trips/ExpensesPanel'
import { getTripById, deleteTrip, exportTripData, updateTrip } from '../services/tripService'
import { formatDateRange, formatDate } from '../utils/dateUtils'
import { downloadBlob, extractFilename } from '../utils/download'
import { useTravelersStore } from '../stores/travelersStore'
import { useChecklistStore } from '../stores/checklistStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { useCollaborationStore } from '../stores/collaborationStore'
import { useItineraryStore } from '../stores/itineraryStore'
import { useExpensesStore } from '../stores/expensesStore'
import { shallow } from 'zustand/shallow'
import { statusOptions, tripSchema, typeOptions } from '../utils/tripSchemas'
import { DatePicker } from '../components/ui/date-picker'
import { Select } from '../components/ui/select'
import { confirmToast } from '../lib/confirmToast'

const overviewFields = [
  { label: 'Destination', key: 'destination', fallback: 'Add destination' },
  { label: 'Trip type', key: 'type', fallback: 'Not set', transform: (value) => value },
  { label: 'Status', key: 'status', fallback: 'Planning', transform: (value) => value },
  {
    label: 'Budget',
    key: 'budgetAmount',
    fallback: '0',
    transform: (value, trip) =>
      `${trip.budgetCurrency || 'USD'} ${Number(value || 0).toLocaleString()}`,
  },
  { label: 'Description', key: 'description', fallback: 'Share the trip story' },
  { label: 'Notes', key: 'notes', fallback: 'No notes yet' },
]

const exportResourceOptions = [
  { value: 'trip', label: 'Trip summary' },
  { value: 'budget', label: 'Budget & expenses' },
]

const exportFormatOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'csv', label: 'CSV' },
]

const checklistPriorityRank = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const emptyTripFormValues = {
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  status: statusOptions[0].value,
  type: typeOptions[0].value,
  budgetCurrency: 'USD',
  budgetAmount: '',
  description: '',
  notes: '',
}

const tripToFormValues = (data) => {
  if (!data) {
    return emptyTripFormValues
  }

  return {
    name: data.name || '',
    destination: data.destination || '',
    startDate: data.startDate ? data.startDate.slice(0, 10) : '',
    endDate: data.endDate ? data.endDate.slice(0, 10) : '',
    status: statusOptions.some((option) => option.value === data.status)
      ? data.status
      : statusOptions[0].value,
    type: typeOptions.some((option) => option.value === data.type) ? data.type : typeOptions[0].value,
    budgetCurrency: data.budgetCurrency || 'USD',
    budgetAmount:
      data.budgetAmount === null || data.budgetAmount === undefined || data.budgetAmount === ''
        ? ''
        : String(data.budgetAmount),
    description: data.description || '',
    notes: data.notes || '',
  }
}

const TripDetail = () => {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [exportResource, setExportResource] = useState('trip')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const [isEditDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [documentsModuleEnabled, setDocumentsModuleEnabled] = useState(false)
  const [isEnablingDocumentsModule, setIsEnablingDocumentsModule] = useState(false)

  const {
    handleSubmit: handleTripUpdateSubmit,
    register: registerTripForm,
    reset: resetTripForm,
    control: tripFormControl,
    formState: { errors: tripFormErrors, isSubmitting: isUpdatingTrip },
  } = useForm({
    resolver: zodResolver(tripSchema),
    defaultValues: emptyTripFormValues,
  })

  const {
    travelers,
    isLoading: travelersLoading,
    fetchTravelers,
    addTraveler,
    updateTraveler,
    removeTraveler,
  } = useTravelersStore(
    (state) => ({
      travelers: state.travelers,
      isLoading: state.isLoading,
      fetchTravelers: state.fetchTravelers,
      addTraveler: state.addTraveler,
      updateTraveler: state.updateTraveler,
      removeTraveler: state.removeTraveler,
    }),
    shallow
  )

  const {
    categories,
    isLoading: checklistLoading,
    fetchBoard,
    createCategory,
    deleteCategory,
    createItem,
    toggleItemCompletion,
    deleteItem,
  } = useChecklistStore(
    (state) => ({
      categories: state.categories,
      isLoading: state.isLoading,
      fetchBoard: state.fetchBoard,
      createCategory: state.createCategory,
      deleteCategory: state.deleteCategory,
      createItem: state.createItem,
      toggleItemCompletion: state.toggleItemCompletion,
      deleteItem: state.deleteItem,
    }),
    shallow
  )

  const {
    documents,
    isLoading: documentsLoading,
    fetchDocuments,
    addDocument,
    updateDocument,
    removeDocument,
  } = useDocumentsStore(
    (state) => ({
      documents: state.documents,
      isLoading: state.isLoading,
      fetchDocuments: state.fetchDocuments,
      addDocument: state.addDocument,
      updateDocument: state.updateDocument,
      removeDocument: state.removeDocument,
    }),
    shallow
  )

  useEffect(() => {
    setDocumentsModuleEnabled(Boolean(trip?.documentsModuleEnabled))
  }, [trip?.documentsModuleEnabled])

  const {
    collaborators,
    collaboratorsMeta,
    collaboratorsLoading,
    shareLinks,
    shareLinksMeta,
    shareLinksLoading,
    fetchCollaborators,
    inviteCollaborator,
    resendInvitation,
    updateCollaboratorPermission,
    removeCollaborator,
    fetchShareLinks,
    createShareLink,
    revokeShareLink,
  } = useCollaborationStore(
    (state) => ({
      collaborators: state.collaborators,
      collaboratorsMeta: state.collaboratorsMeta,
      collaboratorsLoading: state.collaboratorsLoading,
      shareLinks: state.shareLinks,
      shareLinksMeta: state.shareLinksMeta,
      shareLinksLoading: state.shareLinksLoading,
      fetchCollaborators: state.fetchCollaborators,
      inviteCollaborator: state.inviteCollaborator,
      resendInvitation: state.resendInvitation,
      updateCollaboratorPermission: state.updateCollaboratorPermission,
      removeCollaborator: state.removeCollaborator,
      fetchShareLinks: state.fetchShareLinks,
      createShareLink: state.createShareLink,
      revokeShareLink: state.revokeShareLink,
    }),
    shallow
  )

  const {
    items: itineraryItems,
    isLoading: itineraryLoading,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
  } = useItineraryStore(
    (state) => ({
      items: state.items,
      isLoading: state.isLoading,
      fetchItems: state.fetchItems,
      addItem: state.addItem,
      updateItem: state.updateItem,
      removeItem: state.removeItem,
    }),
    shallow
  )

  const {
    expenses,
    isLoading: expensesLoading,
    fetchExpenses,
    addExpense,
    updateExpense,
    removeExpense,
  } = useExpensesStore(
    (state) => ({
      expenses: state.expenses,
      isLoading: state.isLoading,
      fetchExpenses: state.fetchExpenses,
      addExpense: state.addExpense,
      updateExpense: state.updateExpense,
      removeExpense: state.removeExpense,
    }),
    shallow
  )

  useEffect(() => {
    if (trip) {
      resetTripForm(tripToFormValues(trip))
    }
  }, [trip, resetTripForm])

  const handleExport = async () => {
    if (!trip) return

    setIsExporting(true)
    try {
      const result = await exportTripData(tripId, {
        resource: exportResource,
        format: exportFormat,
      })

      const filename = extractFilename(
        result.disposition,
        `${(trip.name || 'trip').toLowerCase().replace(/\s+/g, '-')}-${exportResource}.${exportFormat}`
      )

      downloadBlob(result.blob, filename)
      toast.success(`Export ready: ${exportResource} (${exportFormat.toUpperCase()})`)
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to export right now. Try again soon.'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadTrip = async () => {
      setIsLoadingTrip(true)
      try {
        const data = await getTripById(tripId)
        if (!isActive) return
        setTrip(data)
        setDocumentsModuleEnabled(Boolean(data?.documentsModuleEnabled))
      } catch (error) {
        if (!isActive) return
        const message = error.response?.data?.error?.message || 'Unable to load trip details.'
        toast.error(message)
        navigate('/trips', { replace: true })
      } finally {
        if (isActive) {
          setIsLoadingTrip(false)
        }
      }
    }

    const loadSupportingData = async () => {
      const loaders = [
        fetchTravelers(tripId).catch(() =>
          toast.error('Unable to load travelers. Refresh to try again.')
        ),
        fetchBoard(tripId).catch(() =>
          toast.error('Unable to load checklist. Refresh to try again.')
        ),
        fetchDocuments(tripId).catch(() =>
          toast.error('Unable to load documents. Refresh to try again.')
        ),
        fetchItems(tripId).catch(() =>
          toast.error('Unable to load itinerary. Refresh to try again.')
        ),
        fetchExpenses(tripId).catch(() =>
          toast.error('Unable to load expenses. Refresh to try again.')
        ),
      ]
      await Promise.all(loaders)
    }

    loadTrip()
    loadSupportingData()

    return () => {
      isActive = false
    }
  }, [
    tripId,
    navigate,
    fetchTravelers,
    fetchBoard,
    fetchDocuments,
    fetchItems,
    fetchExpenses,
  ])

  useEffect(() => {
    if (!tripId || !trip?.permission) {
      return
    }

    if (trip.permission.level !== 'admin' && trip.permission.level !== 'edit') {
      return
    }

    fetchCollaborators(tripId, { page: 1 }).catch(() =>
      toast.error('Unable to load collaborators right now.')
    )
  }, [tripId, trip?.permission, fetchCollaborators])

  useEffect(() => {
    if (!tripId || !trip?.permission || trip.permission.level !== 'admin') {
      return
    }

    fetchShareLinks(tripId, { page: 1 }).catch(() =>
      toast.error('Unable to load share links right now.')
    )
  }, [tripId, trip?.permission, fetchShareLinks])

  const handleDeleteTrip = () => {
    const runDeletion = async () => {
      try {
        await deleteTrip(tripId)
        navigate('/trips', { replace: true })
      } catch (error) {
        const message = error.response?.data?.error?.message || 'Unable to delete trip.'
        throw new Error(message)
      }
    }

    confirmToast({
      title: 'Delete this trip?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(runDeletion(), {
          loading: 'Deleting trip…',
          success: 'Trip deleted',
          error: (error) => error.message || 'Unable to delete trip.',
        }),
    })
  }

  const handleOpenEdit = () => {
    if (!trip) return
    resetTripForm(tripToFormValues(trip))
    setEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setEditDialogOpen(false)
    if (trip) {
      resetTripForm(tripToFormValues(trip))
    } else {
      resetTripForm(emptyTripFormValues)
    }
  }

  const renderTripFormError = (fieldError) =>
    fieldError ? <p className="mt-1 text-xs font-medium text-destructive">{fieldError.message}</p> : null

  const handleEnableDocumentsModule = async () => {
    if (!tripId) return

    if (documentsModuleEnabled) {
      setActiveTab('documents')
      return
    }

    if (isEnablingDocumentsModule) {
      return
    }

    setIsEnablingDocumentsModule(true)

    try {
      const updatedTrip = await updateTrip(tripId, {
        documentsModuleEnabled: true,
      })
      setTrip(updatedTrip)
      setDocumentsModuleEnabled(true)
      setActiveTab('documents')
      toast.success('Travel documents enabled')
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to enable travel documents.'
      toast.error(message)
    } finally {
      setIsEnablingDocumentsModule(false)
    }
  }

  const onSubmitTripUpdate = async (values) => {
    try {
      const payload = {
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
      }

      const updatedTrip = await updateTrip(tripId, payload)
      setTrip(updatedTrip)
      resetTripForm(tripToFormValues(updatedTrip))
      setEditDialogOpen(false)
      toast.success('Trip details updated')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to update trip.'
      toast.error(message)
    }
  }

  const checklistStats = useMemo(() => {
    const totalItems = categories.reduce(
      (count, category) => count + (category.items?.length || 0),
      0
    )
    const completedItems = categories.reduce(
      (count, category) =>
        count + (category.items?.filter((item) => Boolean(item.completedAt)).length || 0),
      0
    )

    return {
      totalItems,
      completedItems,
    }
  }, [categories])

  const expiringDocuments = useMemo(
    () => documents.filter((doc) => doc.status === 'expiring_soon' || doc.status === 'expired'),
    [documents]
  )

  const pendingChecklistItems = useMemo(() => {
    if (!categories?.length) return []
    return categories.flatMap((category) =>
      (category.items || [])
        .filter((item) => !item.completedAt)
        .map((item) => ({
          ...item,
          categoryName: category.name,
        }))
    )
  }, [categories])

  const prioritizedChecklistItems = useMemo(() => {
    return pendingChecklistItems
      .slice()
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) {
          const diff = new Date(a.dueDate) - new Date(b.dueDate)
          if (diff !== 0) {
            return diff
          }
        } else if (a.dueDate) {
          return -1
        } else if (b.dueDate) {
          return 1
        }

        const priorityDiff =
          (checklistPriorityRank[a.priority] ?? 99) -
          (checklistPriorityRank[b.priority] ?? 99)
        if (priorityDiff !== 0) {
          return priorityDiff
        }

        return a.title.localeCompare(b.title)
      })
      .slice(0, 4)
  }, [pendingChecklistItems])

  const shouldShowDocumentsTab = documentsModuleEnabled || (documents?.length || 0) > 0

  useEffect(() => {
    if (!shouldShowDocumentsTab && activeTab === 'documents') {
      setActiveTab('checklist')
    }
  }, [shouldShowDocumentsTab, activeTab])

  const canEditTripDetails = trip?.permission?.level === 'admin' || trip?.permission?.level === 'edit'
  const canManageDocuments = canEditTripDetails

  if (isLoadingTrip) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  if (!trip) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{trip.name}</h1>
          <p className="text-sm text-muted-foreground">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/trips"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Back to trips
          </Link>
          {canEditTripDetails && (
            <Button onClick={handleOpenEdit}>Edit trip</Button>
          )}
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={handleDeleteTrip}
          >
            Delete trip
          </Button>
        </div>
      </div>

      <Card aria-labelledby="trip-export-title">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle id="trip-export-title" className="text-lg font-semibold text-foreground">
              Export data
            </CardTitle>
            <CardDescription>
              Download printable summaries or spreadsheets for trip planning and reporting.
            </CardDescription>
          </div>
          <p className="text-sm text-muted-foreground lg:text-right">
            Choose what to export, then download a fresh snapshot at any time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-40">
              <Label htmlFor="export-resource">Dataset</Label>
              <select
                id="export-resource"
                value={exportResource}
                onChange={(event) => setExportResource(event.target.value)}
                aria-label="Select dataset to export"
                className={cn(
                  'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {exportResourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label htmlFor="export-format">Format</Label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value)}
                aria-label="Select export file format"
                className={cn(
                  'border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm shadow-xs outline-none transition focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                {exportFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="sm:w-auto"
              aria-busy={isExporting}
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Generating…
                </span>
              ) : (
                'Download export'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">Trip Snapshot</CardTitle>
              <CardDescription>
                {overviewFields
                  .filter((field) => ['destination', 'type', 'status'].includes(field.key))
                  .map((field) => {
                    const value = trip[field.key]
                    const output = field.transform ? field.transform(value, trip) : value
                    return output || field.fallback
                  })
                  .join(' · ')}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                {travelers.length} traveler{travelers.length === 1 ? '' : 's'}
              </Badge>
              <Badge variant="outline">
                {checklistStats.completedItems}/{checklistStats.totalItems} checklist items
              </Badge>
              <Badge variant="outline">
                {documents.length} document{documents.length === 1 ? '' : 's'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {overviewFields.map(({ label, key, transform, fallback }) => (
          <Card key={key}>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-base text-foreground">
                {transform
                  ? transform(trip[key], trip) || fallback
                  : trip[key] || fallback || 'Not provided'}
              </p>
              {key === 'startDate' && trip.endDate && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="-mx-4 overflow-x-auto pb-2 sm:mx-0">
          <TabsList className="bg-muted min-w-max sm:min-w-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="travelers">Travelers</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            {shouldShowDocumentsTab && <TabsTrigger value="documents">Documents</TabsTrigger>}
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>What to pack next</CardTitle>
                <CardDescription>Instant snapshot of outstanding checklist items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {prioritizedChecklistItems.length ? (
                  prioritizedChecklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-1 rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.categoryName}
                            {item.dueDate && ` • Due ${formatDate(item.dueDate)}`}
                          </p>
                        </div>
                        <Badge className={priorityBadgeClass(item.priority)}>{item.priority}</Badge>
                      </div>
                      {item.assignee && (
                        <span className="text-xs text-muted-foreground">
                          Assigned to {item.assignee.fullName}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You’re packed! Add checklist items to surface them here.
                  </p>
                )}
                <Button size="sm" variant="outline" onClick={() => setActiveTab('checklist')}>
                  Open checklist
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiring Documents</CardTitle>
                <CardDescription>
                  Keep an eye on key documents that need attention.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiringDocuments.length ? (
                  expiringDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/15 p-3 text-warning"
                    >
                      <div>
                        <p className="font-medium capitalize">{document.type}</p>
                        <p className="text-sm">
                          {document.traveler?.fullName || 'Unknown traveler'} ·{' '}
                          {formatDate(document.expiryDate)}
                        </p>
                      </div>
                      <Badge className="bg-warning/15 text-warning">
                        {document.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No expiring documents detected. Enable the documents module to start tracking
                    passports, visas, or insurance.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="travelers">
          <TravelersPanel
            tripId={tripId}
            travelers={travelers}
            isLoading={travelersLoading}
            onAdd={addTraveler}
            onUpdate={updateTraveler}
            onDelete={removeTraveler}
          />
        </TabsContent>

        <TabsContent value="checklist">
          <div className="space-y-4">
            {canManageDocuments && !shouldShowDocumentsTab && (
              <Card className="border-dashed border-primary/40 bg-primary/5">
                <CardHeader>
                  <CardTitle>Need secure document storage?</CardTitle>
                  <CardDescription>
                    Keep passports, visas, and insurance PDFs with the trip without slowing down
                    checklist flows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Enable the travel documents module whenever you’re ready.
                  </p>
                  <Button
                    type="button"
                    onClick={handleEnableDocumentsModule}
                    disabled={isEnablingDocumentsModule}
                  >
                    {isEnablingDocumentsModule ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Enabling…
                      </span>
                    ) : (
                      'Enable travel documents'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
            <ChecklistPanel
              tripId={tripId}
              categories={categories}
              travelers={travelers}
              isLoading={checklistLoading}
              onCreateCategory={createCategory}
              onDeleteCategory={deleteCategory}
              onCreateItem={createItem}
              onToggleItem={toggleItemCompletion}
              onDeleteItem={deleteItem}
            />
          </div>
        </TabsContent>

        {shouldShowDocumentsTab && (
          <TabsContent value="documents">
            <DocumentsPanel
              tripId={tripId}
              documents={documents}
              travelers={travelers}
              isLoading={documentsLoading}
              onAdd={addDocument}
              onUpdate={updateDocument}
              onDelete={removeDocument}
            />
          </TabsContent>
        )}

        <TabsContent value="collaborators">
          <CollaboratorsPanel
            tripId={tripId}
            collaborators={collaborators}
            collaboratorsMeta={collaboratorsMeta}
            shareLinks={shareLinks}
            shareLinksMeta={shareLinksMeta}
            permission={trip.permission}
            collaboratorsLoading={collaboratorsLoading}
            shareLinksLoading={shareLinksLoading}
            onInvite={inviteCollaborator}
            onResend={resendInvitation}
            onRemove={removeCollaborator}
            onUpdatePermission={updateCollaboratorPermission}
            onCreateShareLink={createShareLink}
            onRevokeShareLink={revokeShareLink}
            onFetchCollaborators={fetchCollaborators}
            onFetchShareLinks={fetchShareLinks}
          />
        </TabsContent>

        <TabsContent value="itinerary">
          <ItineraryPanel
            tripId={tripId}
            items={itineraryItems}
            isLoading={itineraryLoading}
            permission={trip.permission}
            tripStartDate={trip.startDate}
            tripEndDate={trip.endDate}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={removeItem}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpensesPanel
            tripId={tripId}
            expenses={expenses}
            isLoading={expensesLoading}
            permission={trip.permission}
            currency={trip?.budgetCurrency}
            onAdd={addExpense}
            onUpdate={updateExpense}
            onDelete={removeExpense}
          />
        </TabsContent>
      </Tabs>

      {canEditTripDetails && (
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              handleOpenEdit()
            } else {
              handleCloseEdit()
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit trip details</DialogTitle>
              <DialogDescription>
                Update the core trip information so everyone stays aligned.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleTripUpdateSubmit(onSubmitTripUpdate)} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-trip-name" required>
                    Trip name
                  </Label>
                  <Input
                    id="edit-trip-name"
                    placeholder="Summer in Lisbon"
                    {...registerTripForm('name')}
                  />
                  {renderTripFormError(tripFormErrors.name)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-trip-destination">Primary destination</Label>
                  <Input
                    id="edit-trip-destination"
                    placeholder="City or region"
                    {...registerTripForm('destination')}
                  />
                  {renderTripFormError(tripFormErrors.destination)}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-trip-start">Start date</Label>
                    <Controller
                      name="startDate"
                      control={tripFormControl}
                      render={({ field }) => (
                        <DatePicker
                          id="edit-trip-start"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select start date"
                        />
                      )}
                    />
                    {renderTripFormError(tripFormErrors.startDate)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-trip-end">End date</Label>
                    <Controller
                      name="endDate"
                      control={tripFormControl}
                      render={({ field }) => (
                        <DatePicker
                          id="edit-trip-end"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select end date"
                        />
                      )}
                    />
                    {renderTripFormError(tripFormErrors.endDate)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-trip-status">Trip status</Label>
                  <Controller
                    name="status"
                    control={tripFormControl}
                    render={({ field }) => (
                      <Select
                        id="edit-trip-status"
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
                  {renderTripFormError(tripFormErrors.status)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-trip-type">Trip type</Label>
                  <Controller
                    name="type"
                    control={tripFormControl}
                    render={({ field }) => (
                      <Select
                        id="edit-trip-type"
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
                  {renderTripFormError(tripFormErrors.type)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-trip-currency">Budget currency</Label>
                  <Input
                    id="edit-trip-currency"
                    className="uppercase"
                    maxLength={3}
                    {...registerTripForm('budgetCurrency')}
                  />
                  {renderTripFormError(tripFormErrors.budgetCurrency)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-trip-budget">Budget amount</Label>
                  <Input
                    id="edit-trip-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...registerTripForm('budgetAmount')}
                  />
                  {renderTripFormError(tripFormErrors.budgetAmount)}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-trip-description">Description</Label>
                  <Textarea
                    id="edit-trip-description"
                    rows={4}
                    placeholder="What is this trip about?"
                    {...registerTripForm('description')}
                  />
                  {renderTripFormError(tripFormErrors.description)}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="edit-trip-notes">Internal notes</Label>
                  <Textarea
                    id="edit-trip-notes"
                    rows={3}
                    placeholder="Log reminders, visa requirements, or planning to-dos."
                    {...registerTripForm('notes')}
                  />
                  {renderTripFormError(tripFormErrors.notes)}
                </div>
              </div>

              <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={handleCloseEdit}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingTrip}>
                  {isUpdatingTrip ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Saving…
                    </span>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

const priorityBadgeClass = (priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive/15 text-destructive'
    case 'high':
      return 'bg-warning/15 text-warning'
    case 'medium':
      return 'bg-info/15 text-info'
    case 'low':
    default:
      return 'bg-muted text-foreground'
  }
}

export default TripDetail
