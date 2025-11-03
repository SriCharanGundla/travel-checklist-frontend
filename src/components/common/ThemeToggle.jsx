import { Moon, Sun } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn('relative h-9 w-9 rounded-md', className)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun
        className={cn(
          'h-5 w-5 transition-all duration-200',
          isDark ? 'scale-75 opacity-0 -rotate-45' : 'scale-100 opacity-100 rotate-0',
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          'absolute h-5 w-5 transition-all duration-200',
          isDark ? 'scale-100 opacity-100 rotate-0' : 'scale-75 opacity-0 rotate-45',
        )}
        aria-hidden="true"
      />
    </Button>
  )
}

export default ThemeToggle
