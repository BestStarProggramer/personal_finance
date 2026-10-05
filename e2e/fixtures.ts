import { test as base, expect } from '@playwright/test'
import type { APIRequestContext, BrowserContext } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { parseDemoData } from '../src/entities/finance/api/demo-data.js'

export { expect }
export type Account = { email: string; password: string; token: string }

export async function createAccount(request: APIRequestContext): Promise<Account> {
  const account = { email: `e2e-${randomUUID()}@example.com`, password: 'TestPassword123', token: '' }
  const registered = await request.post('/api/auth/register', { data: { ...account, token: undefined, name: 'Проверка' } })
  expect(registered.status(), await registered.text()).toBe(201)
  account.token = (await registered.json()).access_token
  return account
}

export async function authorized(request: APIRequestContext, account: Account, method: string, path: string, data?: unknown) {
  let response = await request.fetch(`/api${path}`, { method, data, headers: { Authorization: `Bearer ${account.token}` } })
  if (response.status() === 401) {
    const refresh = await request.post('/api/auth/refresh')
    expect(refresh.status()).toBe(200)
    account.token = (await refresh.json()).access_token
    response = await request.fetch(`/api${path}`, { method, data, headers: { Authorization: `Bearer ${account.token}` } })
  }
  expect(response.ok(), await response.text()).toBe(true)
  return response
}

export async function seed(context: BrowserContext, account: Account) {
  const data = parseDemoData(JSON.parse(readFileSync('public/demo/finance.json', 'utf8')))
  const categories: { id: string; name: string; type: string }[] = await (await authorized(context.request, account, 'GET', '/categories')).json()
  for (const record of data.transactions) {
    const category = categories.find((item) => item.name === record.category && item.type === record.type)!
    await authorized(context.request, account, 'POST', '/transactions', { category_id: category.id, amount_kopecks: record.amountKopecks, date: record.date, comment: record.comment })
  }
  for (const [month, limits] of Object.entries(data.budgets)) {
    for (const [name, amount] of Object.entries(limits)) {
      await authorized(context.request, account, 'POST', '/budgets', { category_id: categories.find((item) => item.name === name && item.type === 'expense')!.id, month: `${month}-01`, limit_kopecks: amount })
    }
  }
}

export const test = base.extend<{ account: Account }>({
  account: [async ({ context }, use) => {
    const account = await createAccount(context.request)
    await seed(context, account)
    await use(account)
  }, { auto: true }],
})
