import type { Transaction, TransactionFilters } from './types.ts'
import { isValidDate } from '../../../shared/lib/date.ts'

export function filterTransactions(transactions: readonly Transaction[], filters: TransactionFilters): Transaction[] {
  if ([filters.date, filters.dateFrom, filters.dateTo].some((date) => date && !isValidDate(date))) return []
  return transactions.filter((transaction) => (
    (!filters.month || transaction.date.startsWith(filters.month)) &&
    (!filters.date || transaction.date === filters.date) &&
    (!filters.dateFrom || transaction.date >= filters.dateFrom) &&
    (!filters.dateTo || transaction.date <= filters.dateTo) &&
    (!filters.type || transaction.type === filters.type) &&
    (!filters.category || transaction.category === filters.category)
  )).sort((a, b) => b.date.localeCompare(a.date))
}
