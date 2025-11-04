import { toast } from 'sonner'

export const confirmToast = ({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  duration = Infinity,
  tone = 'warning',
}) => {
  const variant =
    tone === 'success'
      ? toast.success
      : tone === 'warning' || tone === 'danger'
        ? toast.warning
        : toast

  const id = variant(title, {
    description,
    duration,
    action: {
      label: confirmLabel,
      onClick: () => {
        toast.dismiss(id)
        onConfirm?.()
      },
    },
    cancel: cancelLabel
      ? {
          label: cancelLabel,
          onClick: () => {
            toast.dismiss(id)
            onCancel?.()
          },
        }
      : undefined,
  })

  return id
}
