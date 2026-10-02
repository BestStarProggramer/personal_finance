import { createContext } from 'react'
import type { AsyncState } from '../../../shared/lib/async-state'
import type { BudgetInput, FinanceData, NewTransaction } from './types'

export type FinanceContextValue = {
  state: AsyncState<FinanceData>
  retry: () => void
  addTransaction: (transaction: NewTransaction) => Promise<void>
  saveBudget: (budget: BudgetInput) => Promise<void>
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)
