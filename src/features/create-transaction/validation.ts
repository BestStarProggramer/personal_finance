import { categories } from '../../entities/finance/model/types.ts'
import type { NewTransaction, Category } from '../../entities/finance/model/types.ts'
import { isValidDate } from '../../shared/lib/date.ts'
import { parseAmount } from '../../shared/lib/money.ts'

export type TransactionDraft = Omit<NewTransaction, 'amountKopecks'> & { amount: string }
export type TransactionErrors = Partial<Record<keyof TransactionDraft, string>>

export function validateTransaction(draft: TransactionDraft, available?: Category[]): TransactionErrors {
  const errors: TransactionErrors = {}
  if (parseAmount(draft.amount) === null) errors.amount = 'Введите сумму от 0,01 до 999 999 999,99 ₽, не более двух знаков после запятой.'
  const choices = available ? available.filter((item) => item.type === draft.type).map((item) => item.name) : categories[draft.type]
  if (!choices?.includes(draft.category)) errors.category = 'Выберите категорию для этого типа операции.'
  if (!isValidDate(draft.date)) errors.date = 'Укажите корректную дату.'
  if (draft.comment.trim().length > 200) errors.comment = 'Комментарий должен быть не длиннее 200 символов.'
  return errors
}
