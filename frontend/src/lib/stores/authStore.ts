import { User } from '@/lib/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('laris_token', token)
        }
        set({ token, user, isAuthenticated: true })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('laris_token')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'laris_auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
