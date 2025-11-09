import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Skeleton } from '../ui/skeleton'
import { formatDate } from '../../utils/dateUtils'
import { DatePicker } from '../ui/date-picker'
import { confirmToast } from '../../lib/confirmToast'
import { cn } from '../../lib/utils'
import { GestureHint } from '@/components/common/GestureHint.jsx'
import { useGestureHint } from '@/hooks/useGestureHint.js'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', tone: 'bg-muted text-foreground' },
  { value: 'medium', label: 'Medium', tone: 'bg-info/15 text-info' },
  { value: 'high', label: 'High', tone: 'bg-warning/15 text-warning' },
  { value: 'critical', label: 'Critical', tone: 'bg-destructive/15 text-destructive' },
]

const categoryFormDefaults = {
  name: '',
  description: '',
}

const itemFormDefaults = {
  title: '',
  priority: 'medium',
  dueDate: '',
  assigneeTravelerId: '',
  notes: '',
}

const priorityBadgeClass = (priority) =>
  PRIORITY_OPTIONS.find((option) => option.value === priority)?.tone ||
  'bg-muted text-foreground'

const FILTER_OPTIONS = {
  all: 'Everyone',
  unassigned: 'Unassigned',
}

const getFilterLabel = (filter, travelers) => {
  if (filter === 'all') {
    return FILTER_OPTIONS.all
  }

  if (filter === 'unassigned') {
    return FILTER_OPTIONS.unassigned
  }

  return travelers.find((traveler) => traveler.id === filter)?.fullName || FILTER_OPTIONS.all
}

export const ChecklistPanel = ({
  tripId,
  categories = [],
  travelers = [],
  isLoading,
  onCreateCategory,
  onDeleteCategory,
  onCreateItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [itemDrafts, setItemDrafts] = useState({})
  const [pendingItems, setPendingItems] = useState({})
  const [advancedOpen, setAdvancedOpen] = useState({})
  const [expandedItems, setExpandedItems] = useState({})
  const { visible: checklistHintVisible, acknowledge: acknowledgeChecklistHint } = useGestureHint('checklist-advanced-drawer', {
    autoHideMs: 9000,
  })

  const {
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    reset: resetCategoryForm,
    formState: categoryFormState,
  } = useForm({ defaultValues: categoryFormDefaults })

  useEffect(() => {
    if (!isCategoryDialogOpen) {
      resetCategoryForm(categoryFormDefaults)
    }
  }, [isCategoryDialogOpen, resetCategoryForm])

  const openCategoryDialog = () => {
    resetCategoryForm(categoryFormDefaults)
    setCategoryDialogOpen(true)
  }

  const handleCreateCategory = async (values) => {
    try {
      await onCreateCategory(tripId, values)
      toast.success('Checklist category created')
      setCategoryDialogOpen(false)
    } catch (error) {
      const message =
        error.response?.data?.error?.message ||
        'Unable to create category. Please try again.'
      toast.error(message)
    }
  }

  const getDraftForCategory = (categoryId) => {
    return itemDrafts[categoryId] || itemFormDefaults
  }

  const updateDraftField = (categoryId, field, value) => {
    setItemDrafts((prev) => {
      const current = prev[categoryId] || itemFormDefaults
      return {
        ...prev,
        [categoryId]: {
          ...current,
          [field]: value,
        },
      }
    })
  }

  const resetDraft = (categoryId) => {
    setItemDrafts((prev) => ({
      ...prev,
      [categoryId]: { ...itemFormDefaults },
    }))
  }

  const toggleAdvanced = (categoryId) => {
    setAdvancedOpen((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
    acknowledgeChecklistHint()
  }

  const toggleItemDetails = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  const handleQuickAdd = async (event, categoryId) => {
    event.preventDefault()
    const draft = getDraftForCategory(categoryId)
    const title = draft.title.trim()

    if (!title) {
      toast.error('Add a short label for this checklist item.')
      return
    }

    setPendingItems((prev) => ({ ...prev, [categoryId]: true }))

    try {
      await onCreateItem(categoryId, {
        ...draft,
        title,
      })
      toast.success('Checklist item added')
      resetDraft(categoryId)
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to create item. Please try again.'
      toast.error(message)
    } finally {
      setPendingItems((prev) => ({ ...prev, [categoryId]: false }))
    }
  }

  const handleToggleComplete = async (item) => {
    try {
      await onToggleItem(item.id, !item.completedAt)
    } catch (error) {
      toast.error('Unable to update item status')
    }
  }

  const handleDeleteItem = (item) => {
    confirmToast({
      title: 'Remove checklist item?',
      description: `Remove "${item.title}" from this checklist?`,
      confirmLabel: 'Remove',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(onDeleteItem(item.id), {
          loading: 'Removing item…',
          success: 'Checklist item removed',
          error: 'Unable to remove item. Please try again.',
        }),
    })
  }

  const handleDeleteCategory = (category) => {
    confirmToast({
      title: `Delete ${category.name}?`,
      description: 'All checklist items in this category will be removed.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      tone: 'danger',
      onConfirm: () =>
        toast.promise(onDeleteCategory(tripId, category.id), {
          loading: 'Deleting category…',
          success: 'Checklist category deleted',
          error: (error) =>
            error.response?.data?.error?.message ||
            'Unable to delete category. Please try again.',
        }),
    })
  }

  const matchesFilter = useCallback((item) => {
    if (assigneeFilter === 'all') return true
    if (assigneeFilter === 'unassigned') {
      return !item.assigneeTravelerId
    }
    return item.assigneeTravelerId === assigneeFilter
  }, [assigneeFilter])

  const filterLabel = useMemo(
    () => getFilterLabel(assigneeFilter, travelers),
    [assigneeFilter, travelers]
  )

  const filteredCategories = useMemo(() => {
    return (categories || []).map((category) => ({
      ...category,
      items: (category.items || []).filter(matchesFilter),
    }))
  }, [categories, matchesFilter])

  const renderItemDetails = (item) => {
    const isExpanded = expandedItems[item.id]
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2 sm:flex-nowrap">
          <div className="flex flex-1 items-center gap-3">
            <Checkbox
              className="mt-0.5"
              checked={Boolean(item.completedAt)}
              onCheckedChange={() => handleToggleComplete(item)}
            />
            <div className="flex-1 space-y-1">
              <p
                className={cn('font-medium text-foreground leading-tight', {
                  'text-muted-foreground line-through': item.completedAt,
                })}
              >
                {item.title}
              </p>
              {!isExpanded && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <Badge className={cn('capitalize', priorityBadgeClass(item.priority))}>
                    {item.priority}
                  </Badge>
                  {item.assignee && <span>{item.assignee.fullName}</span>}
                  {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => toggleItemDetails(item.id)}
            >
              {isExpanded ? 'Hide details' : 'Details'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDeleteItem(item)}
            >
              Remove
            </Button>
          </div>
        </div>
        {isExpanded && (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
            <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide">
              <span className="flex items-center gap-1">
                Priority:
                <Badge className={cn('capitalize', priorityBadgeClass(item.priority))}>
                  {item.priority}
                </Badge>
              </span>
              <span>
                Owner:
                {' '}
                {item.assignee?.fullName || 'Anyone'}
              </span>
              <span>
                Due:
                {' '}
                {item.dueDate ? formatDate(item.dueDate) : 'Flexible'}
              </span>
            </div>
            {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checklist</h2>
          <p className="text-sm text-muted-foreground">
            Track pre-trip tasks, packing, documents, and health requirements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Label htmlFor="assigneeFilter" className="text-xs uppercase tracking-wide">
              Show tasks for
            </Label>
            <Select
              id="assigneeFilter"
              value={assigneeFilter}
              onValueChange={setAssigneeFilter}
            >
              <option value="all">Everyone</option>
              <option value="unassigned">Unassigned</option>
              {travelers.map((traveler) => (
                <option key={traveler.id} value={traveler.id}>
                  {traveler.fullName}
                </option>
              ))}
            </Select>
          </div>
          <Button variant="outline" onClick={openCategoryDialog}>
            New Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : filteredCategories?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCategories.map((category, index) => {
            const draft = getDraftForCategory(category.id)
            const isPending = pendingItems[category.id]
            const showAdvanced = advancedOpen[category.id]
            const hasItems = category.items?.length
            const showGestureHint =
              checklistHintVisible && !showAdvanced && index === 0 && travelers.length > 0

            return (
              <Card key={category.id} data-testid={`checklist-category-${category.id}`} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <form
                    data-testid={`quick-add-form-${category.id}`}
                    className="rounded-lg border border-dashed border-border p-3"
                    onSubmit={(event) => handleQuickAdd(event, category.id)}
                  >
                    <Label htmlFor={`quick-add-${category.id}`} className="sr-only">
                      Add an item to {category.name}
                    </Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id={`quick-add-${category.id}`}
                        data-testid={`quick-add-input-${category.id}`}
                        placeholder="Add item"
                        value={draft.title}
                        onChange={(event) => updateDraftField(category.id, 'title', event.target.value)}
                      />
                      <Button type="submit" disabled={isPending}>
                        {isPending ? 'Saving…' : 'Add'}
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Keep it simple. Add details only when needed.</span>
                      <div className="relative inline-flex items-center">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="px-0 text-xs"
                          onClick={() => toggleAdvanced(category.id)}
                          onPointerDown={acknowledgeChecklistHint}
                        >
                          {showAdvanced ? 'Hide advanced' : 'Add details'}
                        </Button>
                        <GestureHint
                          visible={showGestureHint}
                          icon="↕"
                          message="Swipe up for more fields"
                          className="absolute left-1/2 -top-8 -translate-x-1/2"
                        />
                      </div>
                    </div>
                    {showAdvanced && (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="grid gap-2">
                            <Label htmlFor={`priority-${category.id}`}>Priority</Label>
                            <Select
                              id={`priority-${category.id}`}
                              value={draft.priority}
                              onValueChange={(value) => updateDraftField(category.id, 'priority', value)}
                            >
                              {PRIORITY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`due-${category.id}`}>Due date</Label>
                            <DatePicker
                              id={`due-${category.id}`}
                              value={draft.dueDate}
                              onChange={(value) => updateDraftField(category.id, 'dueDate', value)}
                              placeholder="Select due date"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor={`assignee-${category.id}`}>Assignee</Label>
                            <Select
                              id={`assignee-${category.id}`}
                              value={draft.assigneeTravelerId}
                              onValueChange={(value) => updateDraftField(category.id, 'assigneeTravelerId', value)}
                            >
                              <option value="">Anyone</option>
                              {travelers.map((traveler) => (
                                <option key={traveler.id} value={traveler.id}>
                                  {traveler.fullName}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`notes-${category.id}`}>Notes</Label>
                          <Textarea
                            id={`notes-${category.id}`}
                            rows={3}
                            placeholder="Add helpful instructions or links"
                            value={draft.notes}
                            onChange={(event) => updateDraftField(category.id, 'notes', event.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </form>

                  <div className="space-y-3">
                    {hasItems ? (
                      category.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border p-3"
                        >
                          {renderItemDetails(item)}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          {assigneeFilter === 'all'
                            ? 'No checklist items yet.'
                            : `No tasks for ${filterLabel} in this category.`}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted p-10 text-center">
          <p className="text-base font-medium text-foreground">No checklist items yet</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Each new trip comes with recommended categories. Add tasks and packing items to
            collaborate with your travel companions.
          </p>
          <Button onClick={openCategoryDialog}>Create your first category</Button>
        </div>
      )}

      <Dialog open={isCategoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a checklist category</DialogTitle>
            <DialogDescription>
              Group related tasks together so your travel team can stay organized.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCategorySubmit(handleCreateCategory)}>
            <div className="grid gap-3">
              <Label htmlFor="categoryName">Category name</Label>
              <Input
                id="categoryName"
                placeholder="Packing, Tasks, Health…"
                {...registerCategory('name')}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                placeholder="What belongs in this checklist section?"
                rows={3}
                {...registerCategory('description')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={categoryFormState.isSubmitting}>
                Create category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default ChecklistPanel
