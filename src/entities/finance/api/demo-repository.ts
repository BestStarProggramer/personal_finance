import { isValidMonth } from '../../../shared/lib/date.ts'
import { categories } from '../model/types.ts'
import type { BudgetInput, FinanceData, FinanceRepository, NewTransaction } from '../model/types.ts'
import { isAmount, isTransaction, parseDemoData } from './demo-data.ts'

// A small delay makes asynchronous demo operations visible; no backend is required.
const pause = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 250))

export class DemoFinanceRepository implements FinanceRepository {
  private data: FinanceData | null = null

  async load(signal: AbortSignal): Promise<FinanceData> {
    const [response] = await Promise.all([fetch(`${import.meta.env.BASE_URL}demo/finance.json`, { signal, cache: 'no-store' }), pause()])
    if (!response.ok) throw new Error('Не удалось загрузить данные.')
    const value: unknown = await response.json()
    signal.throwIfAborted()
    this.data = parseDemoData(value)
    return this.data
  }

  async addTransaction(transaction: NewTransaction): Promise<FinanceData> {
    await pause()
    if (!this.data || !isTransaction(transaction)) throw new Error('Не удалось сохранить операцию. Проверьте данные и повторите попытку.')
    this.data = { ...this.data, transactions: [{ ...transaction, id: crypto.randomUUID() }, ...this.data.transactions] }
    return this.data
  }

  async saveBudget(input: BudgetInput): Promise<FinanceData> {
    await pause()
    if (!this.data || !isValidMonth(input.month) || !categories.expense.includes(input.category) || !isAmount(input.amountKopecks)) {
      throw new Error('Не удалось сохранить лимит. Проверьте данные и повторите попытку.')
    }
    this.data = { ...this.data, budgets: { ...this.data.budgets, [input.month]: { ...this.data.budgets[input.month], [input.category]: input.amountKopecks } } }
    return this.data
  }
}
