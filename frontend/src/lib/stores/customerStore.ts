import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Customer } from '@/lib/api/customer'

interface CustomerStore {
  customer: Customer | null
  token: string | null
  setCustomer: (customer: Customer, token: string) => void
  updateCustomer: (customer: Customer) => void
  clearCustomer: () => void
  isLoggedIn: () => boolean
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customer: null,
      token: null,

      setCustomer: (customer, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('laris_customer_token', token)
        }
        set({ customer, token })
      },

      updateCustomer: (customer) => set({ customer }),

      clearCustomer: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('laris_customer_token')
        }
        set({ customer: null, token: null })
      },

      isLoggedIn: () => !!get().token,
    }),
    {
      name: 'laris-customer',
      partialize: (state) => ({ customer: state.customer, token: state.token }),
    }
  )
)
