import { Plane } from 'lucide-react'
import { cn } from '../../lib/utils'

const EmptyState = ({ icon: Icon = Plane, title, description, className, action }) => {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-16 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export { EmptyState }
