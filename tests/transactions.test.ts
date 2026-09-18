import test from 'node:test'
import assert from 'node:assert/strict'
import { filterTransactions, parseAmount, validateTransaction } from '../src/data/transactions.ts'
import type { Transaction, TransactionDraft } from '../src/data/transactions.ts'

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
  const filters = { month: '2026-09', type: 'expense', category: 'Продукты' }
  assert.deepEqual(filterTransactions(records, filters).map((item) => item.id), ['b', 'a'])
  assert.equal(filterTransactions(records, { ...filters, month: '2025-01' }).length, 0)
  assert.equal(filterTransactions(records, { month: '', type: '', category: '' }).length, 4)
  assert.deepEqual(records.map((item) => item.id), ['a', 'b', 'c', 'd'])
})
