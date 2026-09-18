import { categories, filterTransactions, localDate } from './transactions.ts'
import type { Transaction } from './transactions.ts'

export type Budgets = Record<string, Record<string, number>>

export function createDemoBudgets(): Budgets {
  return { [localDate().slice(0, 7)]: { Продукты: 1500000, Транспорт: 300000, Жильё: 2500000, Развлечения: 500000 } }
}

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
