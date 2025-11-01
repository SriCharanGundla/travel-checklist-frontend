import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Table = forwardRef(({ className, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm text-slate-700', className)}
      {...props}
    />
  </div>
))
Table.displayName = 'Table'

const TableHeader = ({ className, ...props }) => (
  <thead className={cn('[&_tr]:border-b', className)} {...props} />
)
TableHeader.displayName = 'TableHeader'

const TableBody = ({ className, ...props }) => (
  <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
)
TableBody.displayName = 'TableBody'

const TableFooter = ({ className, ...props }) => (
  <tfoot
    className={cn(
      'bg-slate-100 font-semibold text-slate-900',
      className
    )}
    {...props}
  />
)
TableFooter.displayName = 'TableFooter'

const TableRow = ({ className, ...props }) => (
  <tr
    className={cn(
      'border-b border-slate-100 transition hover:bg-slate-50 data-[state=selected]:bg-slate-100',
      className
    )}
    {...props}
  />
)
TableRow.displayName = 'TableRow'

const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      'h-11 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-slate-500',
      className
    )}
    {...props}
  />
)
TableHead.displayName = 'TableHead'

const TableCell = ({ className, ...props }) => (
  <td className={cn('p-3 align-middle text-sm text-slate-700', className)} {...props} />
)
TableCell.displayName = 'TableCell'

const TableCaption = ({ className, ...props }) => (
  <caption className={cn('mt-4 text-sm text-slate-500', className)} {...props} />
)
TableCaption.displayName = 'TableCaption'

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption }

