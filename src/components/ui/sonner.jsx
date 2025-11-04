import { Toaster as SonnerToaster } from 'sonner'
import { useTheme } from '@/contexts/ThemeContext'

export const Toaster = (props) => {
  const { resolvedTheme } = useTheme()

  return (
    <SonnerToaster
      position="bottom-right"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      richColors
      closeButton
      {...props}
    />
  )
}
