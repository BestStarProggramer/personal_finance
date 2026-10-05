import { categories } from '../../entities/finance/model/types.ts'
import { isValidMonth } from '../../shared/lib/date.ts'
import { parseAmount } from '../../shared/lib/money.ts'

export type BudgetDraft = { month: string; category: string; amount: string }
export type BudgetErrors = Partial<Record<keyof BudgetDraft, string>>

export function validateBudget(draft: BudgetDraft, available: readonly string[] = categories.expense): BudgetErrors {
  const errors: BudgetErrors = {}
  if (!isValidMonth(draft.month)) errors.month = 'Укажите корректный месяц.'
  if (!available.includes(draft.category)) errors.category = 'Выберите расходную категорию.'
  if (parseAmount(draft.amount) === null) errors.amount = 'Введите положительную сумму, до 9 цифр и 2 знаков после запятой.'
  return errors
}
