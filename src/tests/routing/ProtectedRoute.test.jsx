import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../components/common/ProtectedRoute'
import { AuthContext } from '../../contexts/AuthContext'

const baseAuthValue = {
  user: null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
}

const renderWithRouter = (authValue, initialEntries = ['/dashboard']) =>
  render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Home</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to the login page', () => {
    renderWithRouter({
      ...baseAuthValue,
      user: null,
      loading: false,
    })

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders the protected content for authenticated users', () => {
    renderWithRouter({
      ...baseAuthValue,
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
    })

    expect(screen.getByText('Dashboard Home')).toBeInTheDocument()
  })
})

