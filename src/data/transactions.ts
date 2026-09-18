export type TransactionType = 'income' | 'expense'
export const categories: Record<TransactionType, string[]> = {
  income: ['Зарплата', 'Подработка', 'Подарки'],
  expense: ['Продукты', 'Транспорт', 'Жильё', 'Развлечения', 'Здоровье'],
}
export type Transaction = {
  id: string
  type: TransactionType
  amountKopecks: number
  category: string
  date: string
  comment: string
}
export type TransactionDraft = Omit<Transaction, 'id' | 'amountKopecks'> & { amount: string }

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function createDemoTransactions(): Transaction[] {
  const now = new Date()
  const month = localDate(now).slice(0, 7)
  const previousMonth = localDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7)
  return [
    { id: 'demo-1', type: 'income', amountKopecks: 8500000, category: 'Зарплата', date: `${month}-01`, comment: 'Зарплата за месяц' },
    { id: 'demo-2', type: 'expense', amountKopecks: 325050, category: 'Продукты', date: localDate(now), comment: 'Покупки на неделю' },
    { id: 'demo-3', type: 'expense', amountKopecks: 2500000, category: 'Жильё', date: `${month}-01`, comment: 'Аренда' },
    { id: 'demo-4', type: 'expense', amountKopecks: 6500, category: 'Транспорт', date: localDate(now), comment: 'Поездка на метро' },
    { id: 'demo-5', type: 'income', amountKopecks: 1200000, category: 'Подработка', date: `${previousMonth}-20`, comment: 'Разовый проект' },
    { id: 'demo-6', type: 'expense', amountKopecks: 180000, category: 'Развлечения', date: `${previousMonth}-25`, comment: 'Кино' },
  ]
}

export function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(normalized)) return null
  const [rubles, kopecks = ''] = normalized.split('.')
  const amount = Number(rubles) * 100 + Number(kopecks.padEnd(2, '0'))
  return amount > 0 ? amount : null
}

export function validateTransaction(draft: TransactionDraft) {
  const errors: Partial<Record<keyof TransactionDraft, string>> = {}
  if (parseAmount(draft.amount) === null) errors.amount = 'Введите сумму от 0,01 до 999 999 999,99 ₽, не более двух знаков после запятой.'
  if (!categories[draft.type]?.includes(draft.category)) errors.category = 'Выберите категорию для этого типа операции.'
  const date = new Date(`${draft.date}T12:00:00`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || Number.isNaN(date.getTime()) || localDate(date) !== draft.date) errors.date = 'Укажите корректную дату.'
  if (draft.comment.trim().length > 200) errors.comment = 'Комментарий должен быть не длиннее 200 символов.'
  return errors
}

export type TransactionFilters = { month: string; type: string; category: string }
export function filterTransactions(transactions: Transaction[], filters: TransactionFilters) {
  return transactions.filter((transaction) => (
    (!filters.month || transaction.date.startsWith(filters.month)) &&
    (!filters.type || transaction.type === filters.type) &&
    (!filters.category || transaction.category === filters.category)
  )).sort((a, b) => b.date.localeCompare(a.date))
}
export const formatMoney = (kopecks: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(kopecks / 100)
export const formatDate = (date: string) => date.split('-').reverse().join('.')
