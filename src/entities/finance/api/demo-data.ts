import { isValidDate, localDate } from '../../../shared/lib/date.ts'
import { categories } from '../model/types.ts'
import type { FinanceData, NewTransaction, Transaction, TransactionType } from '../model/types.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 99999999999
}

function monthDate(offset: unknown, day: unknown, now: Date): string {
  if (typeof offset !== 'number' || !Number.isInteger(offset) || Math.abs(offset) > 120) throw new Error('Некорректный месяц данных.')
  if (day === 'today' && offset === 0) return localDate(now)
  if (typeof day !== 'number' || !Number.isInteger(day) || day < 1 || day > 31) throw new Error('Некорректная дата данных.')
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const value = `${localDate(first).slice(0, 7)}-${String(day).padStart(2, '0')}`
  if (!isValidDate(value)) throw new Error('Некорректная дата данных.')
  return value
}

export function isTransaction(value: NewTransaction): boolean {
  return (value.type === 'income' || value.type === 'expense') && categories[value.type].includes(value.category)
    && isAmount(value.amountKopecks) && isValidDate(value.date) && value.comment.trim().length <= 200
}

export function parseDemoData(value: unknown, now = new Date()): FinanceData {
  if (!isRecord(value) || !Array.isArray(value.transactions) || !Array.isArray(value.budgets)) throw new Error('Некорректный формат данных.')
  const ids = new Set<string>()
  const transactions = value.transactions.map((item: unknown): Transaction => {
    if (!isRecord(item) || typeof item.id !== 'string' || !item.id || ids.has(item.id)
      || (item.type !== 'income' && item.type !== 'expense') || typeof item.category !== 'string'
      || !isAmount(item.amountKopecks) || typeof item.comment !== 'string' || !isRecord(item.date)) throw new Error('Некорректная операция.')
    const record: Transaction = {
      id: item.id, type: item.type, category: item.category, amountKopecks: item.amountKopecks,
      comment: item.comment, date: monthDate(item.date.monthOffset, item.date.day, now),
    }
    if (!isTransaction(record)) throw new Error('Некорректная операция.')
    ids.add(record.id)
    return record
  })
  const budgets: FinanceData['budgets'] = {}
  for (const item of value.budgets) {
    if (!isRecord(item) || typeof item.category !== 'string' || !categories.expense.includes(item.category)
      || !isAmount(item.amountKopecks)) throw new Error('Некорректный бюджет.')
    const month = monthDate(item.monthOffset, 1, now).slice(0, 7)
    budgets[month] ??= {}
    if (budgets[month][item.category] !== undefined) throw new Error('Повторяющийся бюджет.')
    budgets[month][item.category] = item.amountKopecks
  }
  const demoCategories = (Object.keys(categories) as TransactionType[]).flatMap((type) => categories[type].map((name, index) => ({ id: `${type}-${index}`, name, type })))
  return { transactions, budgets, categories: demoCategories }
}
