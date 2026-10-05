import { createContext } from 'react'

export type User = { id: string; email: string; name: string }
export type Credentials = { email: string; password: string }
export type Registration = Credentials & { name: string }
export type AuthState =
  | { status: 'checking' }
  | { status: 'anonymous' }
  | { status: 'error'; message: string }
  | { status: 'authenticated'; user: User }

export type AuthContextValue = {
  state: AuthState
  retry: () => void
  login: (credentials: Credentials) => Promise<void>
  register: (registration: Registration) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
