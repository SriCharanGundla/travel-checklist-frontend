import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Skeleton } from '../ui/skeleton'
import { formatDate } from '../../utils/dateUtils'

const categoryLabels = {
  accommodation: 'Accommodation',
  transport: 'Transport',
  food: 'Food & Dining',
  activities: 'Activities',
  shopping: 'Shopping',
  other: 'Other',
}

const baseExpense = {
  category: 'other',
  amount: '',
  spentAt: '',
  merchant: '',
  notes: '',
}

const createDefaultExpense = (currency) => ({
  ...baseExpense,
  currency,
})

export const ExpensesPanel = ({
  tripId,
  expenses,
  isLoading,
  permission,
  currency,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const baseCurrency = formatCurrencyCode(currency)
  const [form, setForm] = useState(() => createDefaultExpense(baseCurrency))

  useEffect(() => {
    setForm((prev) => ({ ...prev, currency: baseCurrency }))
  }, [baseCurrency])

  const canEditExpenses = permission?.level === 'admin' || permission?.level === 'edit'

  const totalsByCategory = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      const key = expense.category || 'other'
      const amount = Number(expense.amount || 0)
      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key] += amount
      return acc
    }, {})
  }, [expenses])

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [expenses],
  )

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.amount) {
      toast.error('Enter an amount to add an expense.')
      return
    }

    try {
      await onAdd(tripId, {
        ...form,
        amount: Number(form.amount),
        currency: baseCurrency,
      })
      toast.success('Expense added')
      setForm(createDefaultExpense(baseCurrency))
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to add expense.'
      toast.error(message)
    }
  }

  const handleRemove = async (expense) => {
    const confirmed = window.confirm(`Remove expense from ${expense.merchant || 'this trip'}?`)
    if (!confirmed) return

    try {
      await onDelete(tripId, expense.id)
      toast.success('Expense removed')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Unable to remove expense.'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Trip Budget</CardTitle>
            <CardDescription>Track spending across categories.</CardDescription>
          </div>
          <Badge variant="outline" className="text-base">
            Total: {formatCurrency(totalAmount, baseCurrency)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(totalsByCategory).map(([category, amount]) => (
              <Badge key={category} variant="secondary" className="capitalize">
                {categoryLabels[category] || category}: {formatCurrency(amount, baseCurrency)}
              </Badge>
            ))}
            {!expenses.length && (
              <p className="text-sm text-slate-500">No expenses recorded yet.</p>
            )}
          </div>

          {canEditExpenses && (
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-5">
              <div>
                <Label htmlFor="expense-category" className="text-xs uppercase tracking-wide text-slate-500">
                  Category
                </Label>
                <Select
                  id="expense-category"
                  value={form.category}
                  onChange={handleChange('category')}
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="expense-amount" className="text-xs uppercase tracking-wide text-slate-500">
                  Amount
                </Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange('amount')}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expense-currency" className="text-xs uppercase tracking-wide text-slate-500">
                  Currency
                </Label>
                <Input
                  id="expense-currency"
                  value={baseCurrency}
                  readOnly
                  aria-readonly="true"
                  className="bg-slate-50 text-slate-600"
                />
                <p className="mt-1 text-xs text-slate-400">Adjust the trip currency in trip settings.</p>
              </div>
              <div>
                <Label htmlFor="expense-date" className="text-xs uppercase tracking-wide text-slate-500">
                  Date
                </Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={form.spentAt}
                  onChange={handleChange('spentAt')}
                />
              </div>
              <div>
                <Label htmlFor="expense-merchant" className="text-xs uppercase tracking-wide text-slate-500">
                  Merchant
                </Label>
                <Input
                  id="expense-merchant"
                  placeholder="Airbnb, airline, etc."
                  value={form.merchant}
                  onChange={handleChange('merchant')}
                />
              </div>
              <div className="md:col-span-5">
                <Label htmlFor="expense-notes" className="text-xs uppercase tracking-wide text-slate-500">
                  Notes
                </Label>
                <Input
                  id="expense-notes"
                  placeholder="Optional details"
                  value={form.notes}
                  onChange={handleChange('notes')}
                />
              </div>
              <div className="md:col-span-5 flex justify-end">
                <Button type="submit">Add expense</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Expense Ledger</CardTitle>
          <CardDescription>Recent spending entries.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : expenses?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {canEditExpenses && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm text-slate-700">
                      {expense.spentAt ? formatDate(expense.spentAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {categoryLabels[expense.category] || expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{expense.merchant || '—'}</span>
                        {expense.notes && (
                          <span className="text-xs text-slate-500">{expense.notes}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-900">
                      {formatCurrency(expense.amount, expense.currency || baseCurrency)}
                    </TableCell>
                    {canEditExpenses && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => handleRemove(expense)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500">No expenses logged yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const formatCurrencyCode = (value) => {
  const candidate = (value || 'USD').toString().trim().toUpperCase()
  return /^[A-Z]{3}$/.test(candidate) ? candidate : 'USD'
}

const formatCurrency = (value, currency = 'USD') => {
  const numeric = Number(value || 0)
  const code = formatCurrencyCode(currency)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(numeric)
  } catch (error) {
    return `${code} ${numeric.toFixed(2)}`
  }
}

export default ExpensesPanel
