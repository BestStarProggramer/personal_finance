import { createContext } from 'react'
import type { AsyncState } from '../../../shared/lib/async-state'
import type { BudgetInput, Category, FinanceData, NewTransaction } from './types'

export type FinanceContextValue = {
  state: AsyncState<FinanceData>
  retry: () => void
  addTransaction: (transaction: NewTransaction) => Promise<void>
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>
  updateTransaction: (id: string, transaction: NewTransaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  updateCategory: (id: string, category: Omit<Category, 'id'>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  deleteBudget: (month: string, category: string) => Promise<void>
  saveBudget: (budget: BudgetInput) => Promise<void>
}

export const FinanceContext = createContext<FinanceContextValue | null>(null)
