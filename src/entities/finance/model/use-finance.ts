import { useContext } from 'react'
import { FinanceContext } from './context'

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('FinanceProvider is required')
  return context
}
