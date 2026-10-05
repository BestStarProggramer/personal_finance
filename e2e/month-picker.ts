import type { Page } from '@playwright/test'

export async function chooseMonth(page: Page, value: string) {
  const current = await page.getByRole('textbox', { name: 'Месяц', exact: true }).inputValue()
  let year = current ? Number(current.slice(-4)) : new Date().getFullYear()
  const target = Number(value.slice(0, 4))
  await page.getByRole('button', { name: 'Открыть календарь' }).click()
  while (year !== target) {
    await page.getByRole('button', { name: year > target ? 'Предыдущий год' : 'Следующий год' }).click()
    year += year > target ? -1 : 1
  }
  const month = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(target, Number(value.slice(5)) - 1, 1))
  await page.getByRole('button', { name: `${month} ${target}`, exact: true }).click()
}

