import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockAnimationSettings = { prefersReducedMotion: false }

vi.mock('@/contexts/AnimationSettingsContext.jsx', () => ({
  useAnimationSettings: () => mockAnimationSettings,
}))

let AutomationIndicator

beforeEach(async () => {
  ({ AutomationIndicator } = await import('@/components/common/AutomationIndicator.jsx'))
})

describe('AutomationIndicator', () => {
  it('renders default syncing label', () => {
    render(<AutomationIndicator />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Syncing workspace…')).toBeInTheDocument()
  })

  it('respects custom label and aria-live', () => {
    render(<AutomationIndicator status="success" label="Trip synced" ariaLive="assertive" />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByText('Trip synced')).toBeInTheDocument()
  })

  it('can hide the text label', () => {
    render(<AutomationIndicator showLabel={false} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Syncing workspace…')).not.toBeInTheDocument()
  })
})
