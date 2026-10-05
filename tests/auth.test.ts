import test from 'node:test'
import assert from 'node:assert/strict'
import { validateAuth } from '../src/features/authenticate/validation.ts'

test('регистрация проверяет email, имя, длину пароля и подтверждение; вход не требует имени', () => {
  const draft = { email: 'user@example.com', name: 'Имя', password: 'password123', confirmation: 'password123' }
  assert.deepEqual(validateAuth(draft, true), {})
  assert.deepEqual(validateAuth({ ...draft, name: '', confirmation: '' }, false), {})
  assert.ok(validateAuth({ ...draft, email: 'bad' }, true).email)
  assert.ok(validateAuth({ ...draft, name: ' ' }, true).name)
  assert.ok(validateAuth({ ...draft, password: 'short' }, true).password)
  assert.ok(validateAuth({ ...draft, confirmation: 'other' }, true).confirmation)
})
