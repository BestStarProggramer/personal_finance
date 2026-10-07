import { expect, test } from './fixtures.js'
import type { Page } from '@playwright/test'
import { chooseMonth } from './month-picker.js'

async function capture(page: Page, name: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.MuiCollapse-root:not(.MuiCollapse-entered):not(.MuiCollapse-hidden)')).toHaveCount(0)
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 800 : 1000 })
    // Let textarea autosizing and ResizeObserver finish after the width changes.
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: `docs/screenshots/${name}${width === 320 ? '-mobile' : ''}.png`, fullPage: true, animations: 'disabled' })
  }
}

test('загрузка, ошибка на всех экранах и повторная попытка', async ({ page }) => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/transactions**', async (route) => {
    await gate
    await route.continue()
  })
  try {
    await page.goto('/transactions')
    await expect(page.getByRole('status', { name: 'Загрузка данных' })).toHaveAttribute('aria-busy', 'true')
    await capture(page, 'transactions-loading')
    for (const label of ['Обзор', 'Бюджеты', 'Категории', 'Операции']) {
      await page.getByRole('link', { name: label, exact: true }).click()
      await expect(page.getByRole('status', { name: 'Загрузка данных' })).toBeVisible()
    }
    await page.getByRole('link', { name: 'Добавить операцию' }).click()
    await expect(page.getByRole('status', { name: 'Загрузка данных' })).toBeVisible()
    await page.getByRole('link', { name: 'Операции', exact: true }).click()
  } finally { release() }
  await expect(page.getByRole('status')).toHaveText('Найдено: 6')

  await page.unroute('**/api/transactions**')
  await page.route('**/api/transactions**', (route) => route.abort('failed'))
  await page.reload()
  await expect(page.getByText('Не удалось загрузить данные.', { exact: false })).toBeVisible()
  await capture(page, 'transactions-error')
  for (const [label, title] of [['Обзор', 'Обзор'], ['Бюджеты', 'Бюджеты'], ['Категории', 'Категории']]) {
    await page.getByRole('link', { name: label, exact: true }).click()
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Повторить загрузку' })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Операции', exact: true }).click()
  await page.getByRole('link', { name: 'Добавить операцию' }).click()
  await expect(page.getByRole('button', { name: 'Повторить загрузку' })).toBeVisible()
  await expect(page.getByLabel('Сумма, ₽')).toHaveCount(0)
  await page.unroute('**/api/transactions**')
  await page.getByRole('button', { name: 'Повторить загрузку' }).click()
  await expect(page.getByLabel('Сумма, ₽')).toBeVisible()
  await page.getByRole('link', { name: 'Операции', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 6')
})

test('пустые данные всех экранов и добавление первой операции', async ({ page }) => {
  await page.route('**/api/transactions**', (route) => route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.continue())
  await page.route('**/api/budgets**', (route) => route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.continue())
  await page.goto('/transactions')
  await expect(page.getByText('Добавьте первую операцию', { exact: false })).toBeVisible()
  await capture(page, 'transactions-empty')
  await page.getByRole('link', { name: 'Обзор', exact: true }).click()
  await expect(page.getByText('Операций за этот месяц нет', { exact: true })).toBeVisible()
  await expect(page.getByTestId('expense-total')).toHaveText('0,00 ₽')
  await capture(page, 'overview-empty')
  await page.getByRole('link', { name: 'Бюджеты', exact: true }).click()
  await expect(page.getByText('Бюджеты на этот месяц не заданы')).toBeVisible()
  await capture(page, 'budgets-empty')
  await page.getByRole('link', { name: 'Операции', exact: true }).click()
  await page.getByRole('link', { name: 'Добавить операцию' }).click()
  await page.getByLabel('Тип операции').click()
  await page.getByRole('option', { name: 'Доход', exact: true }).click()
  await page.getByLabel('Сумма, ₽').fill('100')
  await page.getByRole('combobox', { name: 'Категория', exact: true }).click()
  await page.getByRole('option', { name: 'Зарплата', exact: true }).click()
  await page.getByRole('button', { name: 'Сохранить операцию' }).click()
  await expect(page).toHaveURL(/\/transactions$/)
  await expect(page.getByRole('status')).toHaveText('Найдено: 1')
  await page.getByRole('link', { name: 'Обзор', exact: true }).click()
  await expect(page.getByText('Операций за этот месяц нет', { exact: true })).toHaveCount(0)
  await expect(page.getByText('100,00 ₽', { exact: true })).toHaveCount(2)
})

test('ошибки форм, смена типа операции, исправление и защита сохранения', async ({ page }) => {
  let releaseTransaction!: () => void
  let releaseBudget!: () => void
  const transactionGate = new Promise<void>((resolve) => { releaseTransaction = resolve })
  const budgetGate = new Promise<void>((resolve) => { releaseBudget = resolve })
  await page.route('**/api/transactions', async (route) => { await transactionGate; await route.continue() })
  await page.route('**/api/budgets', async (route) => { await budgetGate; await route.continue() })
  await page.goto('/transactions/new')
  await page.getByRole('combobox', { name: 'Категория', exact: true }).click()
  await page.getByRole('option', { name: 'Продукты', exact: true }).click()
  await page.getByLabel('Тип операции').click()
  await page.getByRole('option', { name: 'Доход', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Категория', exact: true })).not.toContainText('Продукты')
  await page.getByLabel('Сумма, ₽').fill('0')
  await page.getByRole('textbox', { name: 'Дата', exact: true }).fill('')
  await page.getByLabel('Комментарий').fill('Длинный комментарий для проверки ограничения. '.repeat(6))
  await page.getByRole('button', { name: 'Сохранить операцию' }).click()
  await expect(page.getByText('Проверьте выделенные поля.')).toBeVisible()
  for (const label of ['Сумма, ₽', 'Дата', 'Комментарий']) await expect(page.getByLabel(label, { exact: false })).toHaveAttribute('aria-invalid', 'true')
  await capture(page, 'new-transaction-errors')
  await page.getByLabel('Сумма, ₽').fill('0,01')
  await page.getByRole('textbox', { name: 'Дата', exact: true }).fill('02.10.2026')
  await page.getByLabel('Комментарий').fill('Минимальная сумма')
  await page.getByRole('combobox', { name: 'Категория', exact: true }).click()
  await page.getByRole('option', { name: 'Зарплата', exact: true }).click()
  const save = page.getByRole('button', { name: 'Сохранить операцию' })
  await save.click()
  await expect(save).toBeDisabled()
  await expect(page.getByLabel('Сумма, ₽')).toBeDisabled()
  releaseTransaction()
  await expect(page).toHaveURL(/\/transactions$/)
  await expect(page.getByText('Минимальная сумма')).toHaveCount(1)
  await expect(page.getByRole('status')).toHaveText('Найдено: 7')

  await page.getByRole('link', { name: 'Бюджеты', exact: true }).click()
  await page.getByRole('button', { name: 'Открыть календарь' }).click()
  await page.getByRole('button', { name: 'Очистить', exact: true }).click()
  await page.getByLabel('Лимит, ₽').fill('-1')
  await page.getByRole('button', { name: 'Сохранить лимит' }).click()
  await expect(page.getByText('Укажите корректный месяц.')).toBeVisible()
  await expect(page.getByLabel('Лимит, ₽')).toHaveAttribute('aria-invalid', 'true')
  await capture(page, 'budgets-errors')
  await chooseMonth(page, '2020-01')
  await page.getByLabel('Лимит, ₽').fill('500')
  await page.getByRole('button', { name: 'Сохранить лимит' }).click()
  await expect(page.getByRole('button', { name: 'Сохранить лимит' })).toBeDisabled()
  releaseBudget()
  await expect(page.getByText('Лимит сохранён.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Продукты', exact: true })).toContainText('Лимит: 500,00')
  await capture(page, 'budgets-saved')
  await chooseMonth(page, '2020-02')
  await expect(page.getByText('Лимит сохранён.')).toHaveCount(0)
  await expect(page.getByText('Бюджеты на этот месяц не заданы')).toBeVisible()
})

test('повреждённый JSON вызывает ошибку, reduced motion отключает переход', async ({ page }) => {
  await page.route('**/api/transactions**', (route) => route.fulfill({ json: [{}] }))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByText('Не удалось загрузить данные.', { exact: false })).toBeVisible()
  await expect(page.locator('.route-transition')).toHaveCSS('animation-name', 'none')
  await page.getByRole('link', { name: 'Настройки', exact: true }).click()
  await expect(page.getByRole('switch', { name: 'Тёмная тема' })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.getByRole('link', { name: 'Обзор', exact: true }).click()
  await expect(page.locator('.route-transition')).toHaveCSS('animation-name', 'page-enter')
})
