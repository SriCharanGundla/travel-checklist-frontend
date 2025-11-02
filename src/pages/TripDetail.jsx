import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Loader2 } from 'lucide-react'
import { TravelersPanel } from '../components/trips/TravelersPanel'
import { ChecklistPanel } from '../components/trips/ChecklistPanel'
import { DocumentsPanel } from '../components/trips/DocumentsPanel'
import { CollaboratorsPanel } from '../components/trips/CollaboratorsPanel'
import { ItineraryPanel } from '../components/trips/ItineraryPanel'
import { ExpensesPanel } from '../components/trips/ExpensesPanel'
import { getTripById, deleteTrip, exportTripData } from '../services/tripService'
import { formatDateRange, formatDate } from '../utils/dateUtils'
import { downloadBlob, extractFilename } from '../utils/download'
import { useTravelersStore } from '../stores/travelersStore'
import { useChecklistStore } from '../stores/checklistStore'
import { useDocumentsStore } from '../stores/documentsStore'
import { useCollaborationStore } from '../stores/collaborationStore'
import { useItineraryStore } from '../stores/itineraryStore'
import { useExpensesStore } from '../stores/expensesStore'
import { shallow } from 'zustand/shallow'

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

const TripDetail = () => {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [isLoadingTrip, setIsLoadingTrip] = useState(true)
  const [exportResource, setExportResource] = useState('trip')
  const [exportFormat, setExportFormat] = useState('pdf')
  const [isExporting, setIsExporting] = useState(false)

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
    createItem,
    toggleItemCompletion,
    deleteItem,
  } = useChecklistStore(
    (state) => ({
      categories: state.categories,
      isLoading: state.isLoading,
      fetchBoard: state.fetchBoard,
      createCategory: state.createCategory,
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

  const handleDeleteTrip = async () => {
    const confirmed = window.confirm('Delete this trip? This cannot be undone.')
    if (!confirmed) return

    try {
      await deleteTrip(tripId)
      toast.success('Trip deleted')
      navigate('/trips', { replace: true })
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to delete trip.'
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
          <h1 className="text-2xl font-semibold text-slate-900">{trip.name}</h1>
          <p className="text-sm text-slate-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/trips"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to trips
          </Link>
          <Button
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={handleDeleteTrip}
          >
            Delete trip
          </Button>
        </div>
      </div>

      <Card aria-labelledby="trip-export-title">
        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle id="trip-export-title" className="text-lg font-semibold text-slate-900">
              Export data
            </CardTitle>
            <CardDescription>
              Download printable summaries or spreadsheets for trip planning and reporting.
            </CardDescription>
          </div>
          <p className="text-sm text-slate-500 lg:text-right">
            Choose what to export, then download a fresh snapshot at any time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[160px]">
              <Label htmlFor="export-resource">Dataset</Label>
              <Select
                id="export-resource"
                value={exportResource}
                onChange={(event) => setExportResource(event.target.value)}
                aria-label="Select dataset to export"
              >
                {exportResourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <Label htmlFor="export-format">Format</Label>
              <Select
                id="export-format"
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value)}
                aria-label="Select export file format"
              >
                {exportFormatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
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
              <CardTitle className="text-lg font-semibold text-slate-900">Trip Snapshot</CardTitle>
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
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-base text-slate-900">
                {transform
                  ? transform(trip[key], trip) || fallback
                  : trip[key] || fallback || 'Not provided'}
              </p>
              {key === 'startDate' && trip.endDate && (
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="travelers">Travelers</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>Stay ahead with your top checklist items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories
                  .flatMap((category) => category.items || [])
                  .filter((item) => !item.completedAt)
                  .slice(0, 4)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <Badge className={priorityBadgeClass(item.priority)}>{item.priority}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {item.assignee && <span>Assigned to {item.assignee.fullName}</span>}
                        {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                      </div>
                    </div>
                  ))}
                {!categories.length && (
                  <p className="text-sm text-slate-500">Add checklist items to see them here.</p>
                )}
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
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800"
                    >
                      <div>
                        <p className="font-medium capitalize">{document.type}</p>
                        <p className="text-sm">
                          {document.traveler?.fullName || 'Unknown traveler'} ·{' '}
                          {formatDate(document.expiryDate)}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">
                        {document.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No expiring documents detected. Add passports, visas, or insurance to enable
                    alerts.
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
          <ChecklistPanel
            tripId={tripId}
            categories={categories}
            travelers={travelers}
            isLoading={checklistLoading}
            onCreateCategory={createCategory}
            onCreateItem={createItem}
            onToggleItem={toggleItemCompletion}
            onDeleteItem={deleteItem}
          />
        </TabsContent>

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
    </div>
  )
}

const priorityBadgeClass = (priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-rose-100 text-rose-700'
    case 'high':
      return 'bg-amber-100 text-amber-700'
    case 'medium':
      return 'bg-blue-100 text-blue-700'
    case 'low':
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default TripDetail
