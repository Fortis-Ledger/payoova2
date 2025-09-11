import React from 'react'
import { describe, it, expect } from 'vitest'
import App from '@/App'
import { renderWithProviders } from '@/test/utils'

// Smoke test for App routing
describe('App', () => {
  it('renders login screen for unauthenticated users', () => {
    const { getByText } = renderWithProviders(<App />, {
      authValue: { user: null, login: () => {}, logout: () => {}, loading: false },
    })

    expect(getByText('Welcome Back')).toBeInTheDocument()
    expect(getByText('Sign In')).toBeInTheDocument()
  })

  it('navigates to dashboard when user is authenticated', () => {
    const { getByText } = renderWithProviders(<App />, {
      authValue: { user: { id: 1, name: 'Test', role: 'user' }, login: () => {}, logout: () => {}, loading: false },
      walletValue: { wallets: [], balances: {}, loading: false, generateWallet: () => {}, refreshBalances: () => {} }
    })

    expect(getByText('Portfolio Overview')).toBeInTheDocument()
  })
})
