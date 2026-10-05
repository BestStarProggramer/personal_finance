import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseDemoData } from '../src/entities/finance/api/demo-data.ts'

const fixture = JSON.parse(readFileSync(new URL('../public/demo/finance.json', import.meta.url), 'utf8'))

test('демоданные разрешают относительные даты, включая переход через Новый год', () => {
  const data = parseDemoData(fixture, new Date(2027, 0, 2))
  assert.equal(data.transactions.length, 6)
  assert.equal(data.transactions[1].date, '2027-01-02')
  assert.equal(data.transactions[4].date, '2026-12-20')
  assert.equal(data.budgets['2027-01'].Продукты, 1500000)
  const empty = parseDemoData({ transactions: [], budgets: [] })
  assert.deepEqual(empty.transactions, [])
  assert.deepEqual(empty.budgets, {})
  assert.equal(empty.categories.length, 8)
})

test('повреждённые демоданные отклоняются до показа интерфейса', () => {
  for (const value of [null, {}, { transactions: {}, budgets: [] }, { transactions: [], budgets: [{}] }]) {
    assert.throws(() => parseDemoData(value))
  }
  const replace = (changes: Record<string, unknown>) => ({ ...fixture, transactions: [{ ...fixture.transactions[0], ...changes }] })
  for (const changes of [{ amountKopecks: 0 }, { amountKopecks: true }, { category: 'Продукты' }, { type: 'other' },
    { comment: 'a'.repeat(201) }, { date: { monthOffset: 0, day: 32 } }, { date: { monthOffset: 0, day: 29 } }]) {
    assert.throws(() => parseDemoData(replace(changes), new Date(2026, 1, 2)))
  }
  assert.throws(() => parseDemoData({ ...fixture, transactions: [fixture.transactions[0], fixture.transactions[0]] }))
})
