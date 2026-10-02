import type { Transaction, TransactionFilters } from './types.ts'

export function filterTransactions(transactions: readonly Transaction[], filters: TransactionFilters): Transaction[] {
  return transactions.filter((transaction) => (
    (!filters.month || transaction.date.startsWith(filters.month)) &&
    (!filters.type || transaction.type === filters.type) &&
    (!filters.category || transaction.category === filters.category)
  )).sort((a, b) => b.date.localeCompare(a.date))
}
