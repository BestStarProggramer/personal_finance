import type { ReactNode } from 'react'
import { useAuth } from '../../entities/auth/model/use-auth'
import FinanceProvider from './FinanceProvider'

export default function FinanceScope({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  return state.status === 'authenticated' ? <FinanceProvider key={state.user.id}>{children}</FinanceProvider> : children
}
