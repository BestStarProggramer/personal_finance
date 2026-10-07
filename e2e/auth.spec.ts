import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { createAccount, authorized } from './fixtures.js'

async function screenshot(page: Page, name: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.MuiCollapse-root:not(.MuiCollapse-entered):not(.MuiCollapse-hidden)')).toHaveCount(0)
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 800 : 1000 })
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/screenshots/${name}${width === 320 ? '-mobile' : ''}.png`, fullPage: true, animations: 'disabled' })
  }
}

test('регистрация, приватный адрес, сохранение в БД, выход и повторный вход', async ({ page, context }) => {
  await page.goto('/budgets')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Вход', exact: true })).toBeVisible()
  await screenshot(page, 'login')
  await page.getByRole('link', { name: 'Создать аккаунт', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Регистрация', exact: true })).toBeVisible()
  await screenshot(page, 'register')
  await page.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click()
  await expect(page.getByText('Проверьте выделенные поля.')).toBeVisible()
  await screenshot(page, 'register-errors')
  const email = `browser-${Date.now()}@example.com`
  await page.getByLabel('Имя').fill('Пользователь')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/^Пароль/).fill('TestPassword123')
  await page.getByLabel('Повторите пароль').fill('TestPassword123')
  await page.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click()
  await expect(page).toHaveURL(/\/budgets$/)
  await expect(page.getByText('Бюджеты на этот месяц не заданы')).toBeVisible()
  const cookie = (await context.cookies()).find((item) => item.name === 'finance_refresh')!
  expect(cookie.httpOnly).toBe(true)
  expect(cookie.path).toBe('/api/auth')
  expect(await page.evaluate(() => document.cookie)).not.toContain('finance_refresh')
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => /token|auth|user/i.test(key)))).toEqual([])

  await page.getByRole('link', { name: 'Операции', exact: true }).click()
  await page.getByRole('link', { name: 'Добавить операцию', exact: true }).click()
  await page.getByLabel('Сумма, ₽').fill('1000')
  await page.getByRole('combobox', { name: 'Категория', exact: true }).click()
  await page.getByRole('option', { name: 'Продукты', exact: true }).click()
  await page.getByLabel('Комментарий').fill('Сохранено в PostgreSQL')
  await page.getByRole('button', { name: 'Сохранить операцию' }).click()
  await expect(page.getByText('Сохранено в PostgreSQL')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Сохранено в PostgreSQL')).toBeVisible()
  await page.getByRole('button', { name: 'Выйти', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  expect((await context.cookies()).filter((item) => item.name === 'finance_refresh')).toEqual([])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Вход', exact: true })).toBeVisible()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/^Пароль/).fill('wrong')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByText('Неверный email или пароль.')).toBeVisible()
  await screenshot(page, 'login-error')
  await page.getByLabel(/^Пароль/).fill('TestPassword123')
  await page.getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(page.getByText('Сохранено в PostgreSQL')).toBeVisible()
})

test('истёкший access обновляется один раз для параллельных запросов', async ({ page, context }) => {
  await createAccount(context.request)
  let refreshes = 0
  page.on('request', (request) => { if (request.url().endsWith('/api/auth/refresh')) refreshes++ })
  await page.goto('/transactions')
  await expect(page.getByRole('status')).toHaveText('Найдено: 0')
  const before = refreshes
  await new Promise((resolve) => setTimeout(resolve, 2100)) // Test API access lifetime is 2 seconds.
  await page.getByRole('button', { name: 'Обновить данные' }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 0')
  expect(refreshes).toBe(before + 1)
  await expect(page.getByRole('button', { name: 'Выйти', exact: true })).toBeVisible()
})

test('отзыв refresh завершает сессию и очищает приватные экраны', async ({ page, context }) => {
  await createAccount(context.request)
  await page.goto('/transactions')
  await expect(page.getByRole('status')).toHaveText('Найдено: 0')
  const old = (await context.cookies()).find((item) => item.name === 'finance_refresh')!
  expect((await context.request.post('/api/auth/logout')).status()).toBe(204)
  await context.addCookies([old])
  await page.getByRole('button', { name: 'Обновить данные' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', { name: 'Выйти', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Операции', exact: true })).toHaveCount(0)
  expect((await context.request.post('/api/auth/refresh')).status()).toBe(401)
})

test('второй пользователь не видит и не изменяет записи первого', async ({ page, context }) => {
  const alice = await createAccount(context.request)
  const categories: { id: string; type: string }[] = await (await authorized(context.request, alice, 'GET', '/categories')).json()
  const category = categories.find((item) => item.type === 'expense')!
  const data = { category_id: category.id, amount_kopecks: 100, date: '2026-10-02', comment: 'Только первый аккаунт' }
  const tx = await (await authorized(context.request, alice, 'POST', '/transactions', data)).json()
  const bob = await createAccount(context.request)
  for (const method of ['GET', 'PUT', 'DELETE']) {
    const response = await context.request.fetch(`/api/transactions/${tx.id}`, { method, data, headers: { Authorization: `Bearer ${bob.token}` } })
    expect(response.status()).toBe(404)
  }
  const foreignCategory = await context.request.post('/api/transactions', { data, headers: { Authorization: `Bearer ${bob.token}` } })
  expect(foreignCategory.status()).toBe(404)
  await page.goto('/transactions')
  await expect(page.getByRole('status')).toHaveText('Найдено: 0')
  await expect(page.getByText('Только первый аккаунт')).toHaveCount(0)
  await page.goto(`/transactions/${tx.id}/edit`)
  await expect(page.getByRole('heading', { name: 'Операция недоступна' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сохранить изменения' })).toHaveCount(0)
})

test('ошибка проверки сессии позволяет повторить запрос', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.abort('failed'))
  await page.goto('/login')
  await expect(page.getByText('Не удалось связаться с сервером.', { exact: false })).toBeVisible()
  await page.unroute('**/api/auth/refresh')
  await page.getByRole('button', { name: 'Повторить проверку сессии' }).click()
  await expect(page.getByRole('heading', { name: 'Вход', exact: true })).toBeVisible()
})
