import test from 'node:test'
import assert from 'node:assert/strict'
import { validateBudget } from '../src/features/set-budget/validation.ts'

test('лимит требует положительную сумму, расходную категорию и корректный месяц', () => {
  const valid = { month: '2026-10', category: 'Продукты', amount: '0,01' }
  assert.deepEqual(validateBudget(valid), {})
  for (const month of ['', '2026-00', '2026-13', '2026-1', '0000-01', '2026-10-01']) {
    assert.ok(validateBudget({ ...valid, month }).month, month)
  }
  for (const category of ['', 'Зарплата', 'Несуществующая']) assert.ok(validateBudget({ ...valid, category }).category)
  for (const amount of ['', '0', '-1', '1.001', '1000000000']) assert.ok(validateBudget({ ...valid, amount }).amount)
})
