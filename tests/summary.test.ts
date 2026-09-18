import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeMonth } from '../src/data/summary.ts'
import type { Transaction } from '../src/data/transactions.ts'

test('итоги учитывают тип, месяц и точные суммы по категориям', () => {
  const records: Transaction[] = [
    { id: '1', type: 'income', amountKopecks: 100000, category: 'Зарплата', date: '2026-09-01', comment: '' },
    { id: '2', type: 'expense', amountKopecks: 29, category: 'Продукты', date: '2026-09-10', comment: '' },
    { id: '3', type: 'expense', amountKopecks: 101, category: 'Продукты', date: '2026-09-30', comment: '' },
    { id: '4', type: 'expense', amountKopecks: 500, category: 'Транспорт', date: '2026-10-01', comment: '' },
  ]
  const result = summarizeMonth(records, '2026-09')
  assert.equal(result.income, 100000)
  assert.equal(result.expense, 130)
  assert.equal(result.balance, 99870)
  assert.equal(result.byCategory.find((item) => item.category === 'Продукты')?.amount, 130)
  assert.equal(result.byCategory.reduce((sum, item) => sum + item.amount, 0), result.expense)
  const empty = summarizeMonth(records, '2025-01')
  assert.equal(empty.balance, 0)
  assert.equal(empty.records.length, 0)
})
