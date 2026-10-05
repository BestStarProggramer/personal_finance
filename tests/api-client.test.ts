import test from 'node:test'
import assert from 'node:assert/strict'
import { ApiClient, ApiError } from '../src/shared/api/client.ts'

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })

test('параллельные 401 запускают одно обновление и повторяют запросы с новым access', async (t) => {
  const client = new ApiClient()
  client.setAccessToken('old')
  let refreshes = 0
  t.mock.method(globalThis, 'fetch', async (path: string, options: RequestInit) => {
    if (path.endsWith('/auth/refresh')) {
      refreshes++
      await new Promise((resolve) => setTimeout(resolve, 10))
      return json({ access_token: 'new' })
    }
    return new Headers(options.headers).get('Authorization') === 'Bearer new' ? json(['own-record']) : json({ detail: 'expired' }, 401)
  })
  const results = await Promise.all([client.request('/transactions'), client.request('/budgets'), client.request('/categories')])
  assert.equal(refreshes, 1)
  assert.deepEqual(results, [['own-record'], ['own-record'], ['own-record']])
})

test('ошибка refresh 401 завершает сессию, а ошибка сети позволяет повторить запрос', async (t) => {
  const client = new ApiClient()
  client.setAccessToken('old')
  let expired = 0
  client.onSessionExpired(() => expired++)
  let refreshStatus = 503
  t.mock.method(globalThis, 'fetch', async (path: string) => json({ detail: 'failure' }, path.endsWith('/auth/refresh') ? refreshStatus : 401))
  await assert.rejects(client.request('/transactions'), (error: unknown) => error instanceof ApiError && error.status === 503)
  assert.equal(expired, 0)
  refreshStatus = 401
  await assert.rejects(client.request('/transactions'), (error: unknown) => error instanceof ApiError && error.status === 401)
  assert.equal(expired, 1)
})

test('неверный пароль не запускает refresh; выход очищает access после подтверждения сервера', async (t) => {
  const client = new ApiClient()
  client.setAccessToken('access')
  let refreshes = 0
  let expired = 0
  let loggedOut = false
  client.onSessionExpired(() => expired++)
  t.mock.method(globalThis, 'fetch', async (path: string) => {
    if (path.endsWith('/auth/logout')) { loggedOut = true; return new Response(null, { status: 204 }) }
    if (path.endsWith('/auth/refresh')) refreshes++
    return json({ detail: 'unauthorized' }, 401)
  })
  await assert.rejects(client.publicRequest('/auth/login', { method: 'POST' }))
  assert.equal(refreshes, 0)
  await client.logout()
  assert.equal(loggedOut, true)
  assert.equal(expired, 1)
  await assert.rejects(client.request('/transactions'))
  assert.equal(refreshes, 1)
})
