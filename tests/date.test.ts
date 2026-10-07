import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDate, parseDate } from '../src/shared/lib/date.ts'

test('русская дата преобразуется в ISO и обратно без зависимости от локали браузера', () => {
  assert.equal(parseDate('08.10.2026'), '2026-10-08')
  assert.equal(formatDate('2026-10-08'), '08.10.2026')
  assert.equal(parseDate('29.02.2024'), '2024-02-29')
  assert.equal(parseDate(' 01.01.2026 '), '2026-01-01')
  for (const value of ['', '08.10.20', '29.02.2025', '31.04.2026', '00.10.2026', '08.13.2026', '08.10.0000', '2026-10-08']) {
    assert.equal(parseDate(value), null, value)
  }
})
