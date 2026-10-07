import test from 'node:test'
import assert from 'node:assert/strict'
import { filterTransactions } from '../src/entities/finance/model/filter.ts'
import { parseAmount } from '../src/shared/lib/money.ts'
import { validateTransaction } from '../src/features/create-transaction/validation.ts'
import type { TransactionDraft } from '../src/features/create-transaction/validation.ts'
import type { Transaction } from '../src/entities/finance/model/types.ts'

test('суммы с запятой и точкой переводятся в целые копейки', () => {
  assert.equal(parseAmount(' 1250,50 '), 125050)
  assert.equal(parseAmount('0.29'), 29)
  assert.equal(parseAmount('1.1'), 110)
  assert.equal(parseAmount('999999999.99'), 99999999999)
  for (const value of ['', '0', '-1', '1.001', 'Infinity', '1e3', '1000000000', 'abc']) {
    assert.equal(parseAmount(value), null, value)
  }
})

const valid: TransactionDraft = { type: 'expense', amount: '100', category: 'Продукты', date: '2024-02-29', comment: '' }

test('форма проверяет календарную дату, категорию и длину комментария', () => {
  assert.deepEqual(validateTransaction(valid), {})
  for (const date of ['', '2025-02-29', '2026-04-31', 'not-a-date']) {
    assert.ok(validateTransaction({ ...valid, date }).date, date)
  }
  assert.ok(validateTransaction({ ...valid, category: '' }).category)
  assert.ok(validateTransaction({ ...valid, type: 'income' }).category)
  assert.ok(validateTransaction({ ...valid, comment: 'a'.repeat(201) }).comment)
  assert.ok(validateTransaction({ ...valid, amount: '0' }).amount)
})

test('фильтры сочетаются, границы месяца учитываются, исходный массив не меняется', () => {
  const base: Transaction = { id: 'a', type: 'expense', amountKopecks: 100, category: 'Продукты', date: '2026-09-01', comment: '' }
  const records: Transaction[] = [base,
    { ...base, id: 'b', date: '2026-09-30' },
    { ...base, id: 'c', date: '2026-10-01' },
    { ...base, id: 'd', type: 'income', category: 'Зарплата' },
  ]
  const filters = { month: '2026-09', type: 'expense' as const, category: 'Продукты' }
  assert.deepEqual(filterTransactions(records, filters).map((item) => item.id), ['b', 'a'])
  assert.deepEqual(filterTransactions(records, { ...filters, date: '2026-09-01' }).map((item) => item.id), ['a'])
  assert.equal(filterTransactions(records, { ...filters, date: '2026-09-02' }).length, 0)
  assert.deepEqual(filterTransactions(records, { month: '', date: '2026-09-01', type: '', category: '' }).map((item) => item.id), ['a', 'd'])
  assert.equal(filterTransactions(records, { ...filters, month: '2025-01' }).length, 0)
  assert.equal(filterTransactions(records, { month: '', type: '', category: '' }).length, 4)
  assert.deepEqual(records.map((item) => item.id), ['a', 'b', 'c', 'd'])
})

test('период включает обе границы и сочетается с месяцем, типом и категорией', () => {
  const base: Transaction = { id: 'before', type: 'expense', amountKopecks: 100, category: 'Продукты', date: '2026-10-02', comment: '' }
  const records: Transaction[] = [base,
    { ...base, id: 'start', date: '2026-10-03' },
    { ...base, id: 'end', date: '2026-10-08' },
    { ...base, id: 'after', date: '2026-10-09' },
    { ...base, id: 'income', date: '2026-10-05', type: 'income', category: 'Зарплата' },
    { ...base, id: 'other-category', date: '2026-10-06', category: 'Транспорт' },
  ]
  const filters = { month: '', type: '' as const, category: '', dateFrom: '2026-10-03', dateTo: '2026-10-08' }
  assert.deepEqual(filterTransactions(records, filters).map((item) => item.id), ['end', 'other-category', 'income', 'start'])
  assert.deepEqual(filterTransactions(records, { ...filters, month: '2026-10', type: 'expense', category: 'Продукты' }).map((item) => item.id), ['end', 'start'])
  assert.deepEqual(filterTransactions(records, { ...filters, dateFrom: '2026-10-08' }).map((item) => item.id), ['end'])
  assert.equal(filterTransactions(records, { ...filters, month: '2026-09' }).length, 0)
  assert.equal(filterTransactions(records, { ...filters, dateFrom: '2026-10-09' }).length, 0)
  assert.equal(filterTransactions(records, { ...filters, dateTo: '' }).length, 5)
  assert.equal(filterTransactions(records, { ...filters, dateFrom: '' }).length, 5)
  assert.deepEqual(records.map((item) => item.id), ['before', 'start', 'end', 'after', 'income', 'other-category'])
})

test('период может пересекать месяцы и годы, пустые границы не ограничивают даты', () => {
  const base: Transaction = { id: 'december', type: 'expense', amountKopecks: 100, category: 'Продукты', date: '2025-12-31', comment: '' }
  const records = [base, { ...base, id: 'january', date: '2026-01-01' }, { ...base, id: 'february', date: '2026-02-01' }]
  const filters = { month: '', type: '' as const, category: '', dateFrom: '2025-12-31', dateTo: '2026-01-01' }
  assert.deepEqual(filterTransactions(records, filters).map((item) => item.id), ['january', 'december'])
  assert.equal(filterTransactions(records, { ...filters, dateFrom: '', dateTo: '' }).length, 3)
})
