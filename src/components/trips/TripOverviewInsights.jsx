import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/dateUtils'
import { panelVariants, createStaggeredContainer, listItemVariants } from '@/lib/animation'

const quickInsightsVariants = createStaggeredContainer(0.08)
const listContainerVariants = createStaggeredContainer(0.06)

export function TripOverviewInsights({
  prioritizedChecklistItems,
  expiringDocuments,
  documentsModuleEnabled,
  isEnablingDocumentsModule,
  onOpenChecklist,
  onEnableDocumentsModule,
  priorityBadgeClass,
}) {
  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2"
      initial="hidden"
      animate="visible"
      variants={quickInsightsVariants}
    >
      <motion.div variants={panelVariants}>
        <div className="rounded-xl bg-card shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-foreground">What to pack next</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Instant snapshot of outstanding checklist items.
            </p>
          </div>
          <div className="space-y-3 border-t border-border px-5 py-4">
            {prioritizedChecklistItems.length ? (
              <motion.div
                className="space-y-3"
                variants={listContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {prioritizedChecklistItems.map((item) => (
                  <motion.div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3"
                    variants={listItemVariants}
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
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">
                You’re packed! Add checklist items to surface them here.
              </p>
            )}
            <Button size="sm" variant="outline" onClick={onOpenChecklist}>
              Open checklist
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={panelVariants}>
        <div className="rounded-xl bg-card shadow-sm">
          <div className="p-5">
            <h3 className="text-lg font-semibold text-foreground">Expiring documents</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep an eye on key documents that need attention.
            </p>
          </div>
          <div className="space-y-3 border-t border-border px-5 py-4">
            {expiringDocuments.length ? (
              <motion.div
                className="space-y-3"
                variants={listContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {expiringDocuments.map((document) => (
                  <motion.div
                    key={document.id}
                    className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/15 p-3 text-warning"
                    variants={listItemVariants}
                  >
                    <div>
                      <p className="font-medium capitalize">{document.type}</p>
                      <p className="text-sm">
                        {document.traveler?.fullName || 'Unknown traveler'} · {formatDate(document.expiryDate)}
                      </p>
                    </div>
                    <Badge className="bg-warning/15 text-warning">{document.status.replace('_', ' ')}</Badge>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No expiring documents detected. Enable the documents module to start tracking passports, visas, or insurance.
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onEnableDocumentsModule}
              disabled={isEnablingDocumentsModule}
            >
              {documentsModuleEnabled ? 'Open documents' : isEnablingDocumentsModule ? 'Enabling…' : 'Enable documents'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
