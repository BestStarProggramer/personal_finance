import { test, expect, authorized } from './fixtures.js'
import { chooseMonth } from './month-picker.js'

test('месяц и период фильтруют операции с границами, типом, категорией и сбросом', async ({ page, context, account }) => {
  const categories: { id: string; name: string }[] = await (await authorized(context.request, account, 'GET', '/categories')).json()
  for (const [date, name] of [
    ['2020-09-30', 'Продукты'], ['2020-10-02', 'Продукты'], ['2020-10-03', 'Продукты'],
    ['2020-10-05', 'Зарплата'], ['2020-10-08', 'Продукты'], ['2020-10-09', 'Продукты'], ['2020-11-01', 'Продукты'],
  ]) {
    await authorized(context.request, account, 'POST', '/transactions', {
      category_id: categories.find((item) => item.name === name)!.id, amount_kopecks: 100, date, comment: `Период ${date}`,
    })
  }
  await page.goto('/transactions')
  await expect(page.getByRole('status')).toHaveText('Найдено: 13')
  await page.getByRole('button', { name: 'За месяц', exact: true }).click()
  await chooseMonth(page, '2020-10')
  await expect(page.getByRole('status')).toHaveText('Найдено: 5')
  await expect(page.getByText('Период 2020-09-30')).toHaveCount(0)
  await expect(page.getByText('Период 2020-11-01')).toHaveCount(0)
  await page.getByRole('button', { name: 'Открыть календарь' }).click()
  await page.getByRole('button', { name: 'Очистить', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 13')
  await page.getByRole('button', { name: 'За период', exact: true }).click()
  await page.getByLabel('Дата с', { exact: true }).fill('03.10.2020')
  await page.getByLabel('Дата по', { exact: true }).fill('08.10.2020')
  await expect(page.getByRole('status')).toHaveText('Найдено: 3')
  await expect(page.getByText('Период 2020-10-03')).toBeVisible()
  await expect(page.getByText('Период 2020-10-08')).toBeVisible()
  await page.getByRole('button', { name: 'Открыть календарь: Дата с' }).click()
  await expect(page.getByRole('dialog', { name: 'Выбор даты' })).toContainText('октябрь 2020')
  await page.getByRole('button', { name: 'Очистить', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 5')
  await page.getByLabel('Дата с', { exact: true }).fill('03.10.2020')
  await page.getByLabel('Тип операции').click()
  await page.getByRole('option', { name: 'Расход', exact: true }).click()
  await page.getByLabel('Категория').click()
  await page.getByRole('option', { name: 'Продукты', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 2')
  await page.getByLabel('Дата по', { exact: true }).fill('02.10.2020')
  await expect(page.getByText('Конец периода не может быть раньше начала.')).toBeVisible()
  await expect(page.getByLabel('Дата по', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  await page.getByRole('button', { name: 'Открыть календарь: Дата по' }).click()
  await page.getByRole('button', { name: 'четверг, 8 октября 2020 г.' }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 2')
  await expect(page.getByText('Конец периода не может быть раньше начала.')).toHaveCount(0)
  await page.setViewportSize({ width: 320, height: 800 })
  await expect(page.getByLabel('Дата с', { exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Сбросить фильтры' }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 13')
  await expect(page.getByLabel('Дата с', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Дата по', { exact: true })).toHaveValue('')
  await page.getByRole('button', { name: 'За день', exact: true }).click()
  await page.getByLabel('Дата', { exact: true }).fill('03.10.2020')
  await expect(page.getByRole('status')).toHaveText('Найдено: 1')
  await page.getByRole('button', { name: 'За месяц', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Найдено: 13')
})
