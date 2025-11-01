import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Skeleton } from '../ui/skeleton'
import { formatDate } from '../../utils/dateUtils'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', tone: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Medium', tone: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', tone: 'bg-amber-100 text-amber-700' },
  { value: 'critical', label: 'Critical', tone: 'bg-rose-100 text-rose-700' },
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
  'bg-slate-100 text-slate-700'

export const ChecklistPanel = ({
  tripId,
  categories,
  travelers,
  isLoading,
  onCreateCategory,
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

  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(`Remove "${item.title}" from this checklist?`)
    if (!confirmed) return
    try {
      await onDeleteItem(item.id)
      toast.success('Checklist item removed')
    } catch (error) {
      toast.error('Unable to remove item. Please try again.')
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
          <p className="text-sm text-slate-500">
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
              <CardHeader className="space-y-1">
                <CardTitle>{category.name}</CardTitle>
                {category.description && (
                  <CardDescription>{category.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="space-y-3">
                  {category.items?.length ? (
                    category.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex gap-3">
                          <Checkbox
                            checked={Boolean(item.completedAt)}
                            onCheckedChange={() => handleToggleComplete(item)}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <Badge className={priorityBadgeClass(item.priority)}>
                                {item.priority}
                              </Badge>
                              {item.assignee && (
                                <span>Assigned to {item.assignee.fullName}</span>
                              )}
                              {item.dueDate && <span>Due {formatDate(item.dueDate)}</span>}
                            </div>
                            {item.notes && (
                              <p className="mt-2 text-sm text-slate-600">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={() => handleDeleteItem(item)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                      <p className="text-sm text-slate-500">No checklist items yet.</p>
                    </div>
                  )}
                </div>
                <Button onClick={() => openItemDialog(category.id)}>Add Item</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-base font-medium text-slate-700">No checklist items yet</p>
          <p className="text-sm text-slate-500 max-w-md">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add checklist item</DialogTitle>
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
                <Select id="itemPriority" {...registerItem('priority')} required>
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemDueDate">Due date</Label>
                <Input id="itemDueDate" type="date" {...registerItem('dueDate')} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="itemAssignee">Assignee</Label>
                <Select id="itemAssignee" {...registerItem('assigneeTravelerId')}>
                  <option value="">Unassigned</option>
                  {travelers.map((traveler) => (
                    <option key={traveler.id} value={traveler.id}>
                      {traveler.fullName}
                    </option>
                  ))}
                </Select>
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

