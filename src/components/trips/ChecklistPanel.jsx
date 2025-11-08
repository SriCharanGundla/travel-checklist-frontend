import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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

export const ChecklistPanel = ({
  tripId,
  categories,
  travelers,
  isLoading,
  onCreateCategory,
  onDeleteCategory,
  onCreateItem,
  onToggleItem,
  onDeleteItem,
}) => {
  const [isCategoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  const [isItemDialogOpen, setItemDialogOpen] = useState(false)

  const {
    register: registerCategory,
    handleSubmit: handleCategorySubmit,
    reset: resetCategoryForm,
    formState: categoryFormState,
  } = useForm({ defaultValues: categoryFormDefaults })

  const {
    register: registerItem,
    handleSubmit: handleItemSubmit,
    reset: resetItemForm,
    control: itemControl,
    formState: itemFormState,
  } = useForm({ defaultValues: itemFormDefaults })

  useEffect(() => {
    if (!isItemDialogOpen) {
      resetItemForm({
        ...itemFormDefaults,
        assigneeTravelerId: travelers?.[0]?.id || '',
      })
    }
  }, [isItemDialogOpen, resetItemForm, travelers])

  const openCategoryDialog = () => {
    resetCategoryForm(categoryFormDefaults)
    setCategoryDialogOpen(true)
  }

  const openItemDialog = (categoryId) => {
    setActiveCategoryId(categoryId)
    resetItemForm({
      ...itemFormDefaults,
      assigneeTravelerId: travelers?.[0]?.id || '',
    })
    setItemDialogOpen(true)
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

  const handleCreateItem = async (values) => {
    if (!activeCategoryId) return
    try {
      await onCreateItem(activeCategoryId, values)
      toast.success('Checklist item added')
      setItemDialogOpen(false)
    } catch (error) {
      const message =
        error.response?.data?.error?.message || 'Unable to create item. Please try again.'
      toast.error(message)
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

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checklist</h2>
          <p className="text-sm text-muted-foreground">
            Track pre-trip tasks, packing, documents, and health requirements.
          </p>
        </div>
        <Button variant="outline" onClick={openCategoryDialog}>
          New Category
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : categories?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {categories.map((category) => (
            <Card key={category.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>{category.name}</CardTitle>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
                  </div>
                  <Button
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
                <div className="space-y-3">
                  {category.items?.length ? (
                    category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={Boolean(item.completedAt)}
                            onCheckedChange={() => handleToggleComplete(item)}
                          />
                          <div>
                            <p className="font-medium text-foreground">{item.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <Badge className={priorityBadgeClass(item.priority)}>
                                {item.priority}
                              </Badge>
                              {item.assignee && (
                                <span>Assigned to {item.assignee.fullName}</span>
                              )}
                              {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                            </div>
                            {item.notes && (
                              <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteItem(item)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <p className="text-sm text-muted-foreground">No checklist items yet.</p>
                    </div>
                  )}
                </div>
                <Button onClick={() => openItemDialog(category.id)}>Add Item</Button>
              </CardContent>
            </Card>
          ))}
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

      <Dialog open={isItemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>Add checklist item</DialogTitle>
            <DialogDescription>
              Capture a single task, deadline, and assignee for this category.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleItemSubmit(handleCreateItem)}>
            <div className="grid gap-3">
              <Label htmlFor="itemTitle">Title</Label>
              <Input
                id="itemTitle"
                placeholder="Book flights, renew passport…"
                {...registerItem('title')}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="itemPriority">Priority</Label>
                <Controller
                  name="priority"
                  control={itemControl}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      id="itemPriority"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemDueDate">Due date</Label>
                <Controller
                  control={itemControl}
                  name="dueDate"
                  render={({ field }) => (
                    <DatePicker
                      id="itemDueDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Select due date"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemAssignee">Assignee</Label>
                <Controller
                  name="assigneeTravelerId"
                  control={itemControl}
                  render={({ field }) => (
                    <Select
                      id="itemAssignee"
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    >
                      <option value="">Unassigned</option>
                      {travelers.map((traveler) => (
                        <option key={traveler.id} value={traveler.id}>
                          {traveler.fullName}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label htmlFor="itemNotes">Notes</Label>
              <Textarea
                id="itemNotes"
                rows={3}
                placeholder="Add helpful instructions or links"
                {...registerItem('notes')}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={itemFormState.isSubmitting}>
                Add to checklist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default ChecklistPanel
