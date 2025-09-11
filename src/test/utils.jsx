import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock contexts
const mockAuthContext = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
}

const mockWalletContext = {
  wallets: [],
  balances: {},
  loading: false,
  generateWallet: vi.fn(),
  sendCrypto: vi.fn(),
  refreshBalances: vi.fn(),
  getBalanceByNetwork: vi.fn(() => '0'),
  getPriceBySymbol: vi.fn(() => '$0.00'),
}

// Mock AuthContext
export const MockAuthProvider = ({ children, value = mockAuthContext }) => {
  const AuthContext = React.createContext(value)
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Mock WalletContext
export const MockWalletProvider = ({ children, value = mockWalletContext }) => {
  const WalletContext = React.createContext(value)
  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// Custom render function with all providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    authValue = mockAuthContext,
    walletValue = mockWalletContext,
    ...renderOptions
  } = options

  const AllProviders = ({ children }) => (
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        <MockWalletProvider value={walletValue}>
          {children}
        </MockWalletProvider>
      </MockAuthProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: AllProviders, ...renderOptions })
}

// Mock API responses
export const mockApiResponses = {
  login: {
    success: true,
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
    token: 'mock-token',
  },
  walletCreate: {
    success: true,
    wallet: {
      id: 1,
      address: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
      balance: '0.0',
    },
  },
  transaction: {
    success: true,
    transaction: {
      id: 1,
      transaction_hash: '0xabcdef1234567890',
      from_address: '0x1234567890123456789012345678901234567890',
      to_address: '0x0987654321098765432109876543210987654321',
      amount: '1.0',
      status: 'pending',
    },
  },
}

// Mock fetch
export const createMockFetch = (responses) => {
  return vi.fn((url, options) => {
    const method = options?.method || 'GET'
    const key = `${method} ${url}`
    
    if (responses[key]) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responses[key]),
      })
    }
    
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    })
  })
}

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
