import { categories } from './types.ts'
import type { Transaction } from './types.ts'
import { filterTransactions } from './filter.ts'

export function summarizeMonth(transactions: Transaction[], month: string) {
  const records = filterTransactions(transactions, { month, type: '', category: '' })
  const income = records.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amountKopecks, 0)
  const expense = records.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountKopecks, 0)
  const byCategory = categories.expense.map((category) => ({
    category,
    amount: records.filter((item) => item.type === 'expense' && item.category === category).reduce((sum, item) => sum + item.amountKopecks, 0),
  }))
  return { records, income, expense, balance: income - expense, byCategory }
}
