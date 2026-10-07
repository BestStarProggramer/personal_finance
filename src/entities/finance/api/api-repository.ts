import { ApiError, apiClient } from '../../../shared/api/client'
import type { BudgetInput, Category, FinanceData, FinanceRepository, NewTransaction } from '../model/types'

type ApiTransaction = { id: string; category_id: string; amount_kopecks: number; date: string; comment: string }
type ApiBudget = { id: string; category_id: string; month: string; limit_kopecks: number }

async function all<T>(path: string, signal: AbortSignal): Promise<T[]> {
  const result: T[] = []
  for (let offset = 0; ; offset += 100) {
    const page = await apiClient.request<T[]>(`${path}?limit=100&offset=${offset}`, { signal })
    if (!Array.isArray(page)) throw new Error('Сервер вернул некорректные данные.')
    result.push(...page)
    if (page.length < 100) return result
  }
}

export class ApiFinanceRepository implements FinanceRepository {
  private data: FinanceData | null = null
  private budgets: ApiBudget[] = []
  private revision = 0

  async load(signal: AbortSignal): Promise<FinanceData> {
    const revision = this.revision
    const [categories, transactions, budgets] = await Promise.all([
      all<Category>('/categories', signal), all<ApiTransaction>('/transactions', signal), all<ApiBudget>('/budgets', signal),
    ])
    signal.throwIfAborted()
    if (revision !== this.revision) return this.load(signal)
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const records = transactions.map((record) => {
      const category = categoryById.get(record.category_id)
      if (!category) throw new Error('Не найдена категория операции.')
      return { id: record.id, type: category.type, category: category.name, amountKopecks: record.amount_kopecks, date: record.date, comment: record.comment }
    })
    const limits: FinanceData['budgets'] = {}
    for (const budget of budgets) {
      const category = categoryById.get(budget.category_id)
      if (!category) throw new Error('Не найдена категория бюджета.')
      const month = budget.month.slice(0, 7)
      limits[month] ??= {}
      limits[month] = { ...limits[month], [category.name]: budget.limit_kopecks }
    }
    this.budgets = budgets
    this.data = { transactions: records, budgets: limits, categories }
    return this.data
  }

  async addCategory(input: Omit<Category, 'id'>): Promise<FinanceData> {
    if (!this.data) throw new Error('Дождитесь загрузки данных.')
    const category = await apiClient.request<Category>('/categories', { method: 'POST', json: input })
    this.revision++
    this.data = { ...this.data, categories: [...this.data.categories, category] }
    return this.data
  }

  async addTransaction(transaction: NewTransaction): Promise<FinanceData> {
    return this.writeTransaction(transaction)
  }

  async updateTransaction(id: string, transaction: NewTransaction): Promise<FinanceData> {
    return this.writeTransaction(transaction, id)
  }

  private async writeTransaction(transaction: NewTransaction, id?: string): Promise<FinanceData> {
    const category = this.data?.categories.find((item) => item.type === transaction.type && item.name === transaction.category)
    if (!this.data || !category) throw new Error('Выберите доступную категорию операции.')
    const record = await apiClient.request<ApiTransaction>(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', json: {
      category_id: category.id, amount_kopecks: transaction.amountKopecks, date: transaction.date, comment: transaction.comment,
    } })
    const savedCategory = this.data.categories.find((item) => item.id === record.category_id)
    if (!savedCategory) throw new Error('Обновите данные: категория операции изменилась.')
    const saved = { id: record.id, type: savedCategory.type, category: savedCategory.name, amountKopecks: record.amount_kopecks, date: record.date, comment: record.comment }
    this.revision++
    this.data = { ...this.data, transactions: id
      ? this.data.transactions.map((item) => item.id === id ? saved : item)
      : [saved, ...this.data.transactions] }
    return this.data
  }

  async deleteTransaction(id: string): Promise<FinanceData> {
    if (!this.data) throw new Error('Дождитесь загрузки данных.')
    await apiClient.request(`/transactions/${id}`, { method: 'DELETE' })
    this.revision++
    this.data = { ...this.data, transactions: this.data.transactions.filter((item) => item.id !== id) }
    return this.data
  }

  async updateCategory(id: string, input: Omit<Category, 'id'>): Promise<FinanceData> {
    const previous = this.data?.categories.find((item) => item.id === id)
    if (!this.data || !previous) throw new Error('Категория не найдена. Обновите данные.')
    const category = await apiClient.request<Category>(`/categories/${id}`, { method: 'PUT', json: input })
    this.revision++
    this.data = {
      ...this.data,
      categories: this.data.categories.map((item) => item.id === id ? category : item),
      transactions: this.data.transactions.map((item) => item.type === previous.type && item.category === previous.name
        ? { ...item, category: category.name, type: category.type } : item),
      budgets: Object.fromEntries(Object.entries(this.data.budgets).map(([month, limits]) => [month,
        Object.fromEntries(Object.entries(limits).map(([name, amount]) => [previous.type === 'expense' && name === previous.name ? category.name : name, amount])),
      ])),
    }
    return this.data
  }

  async deleteCategory(id: string): Promise<FinanceData> {
    if (!this.data) throw new Error('Дождитесь загрузки данных.')
    await apiClient.request(`/categories/${id}`, { method: 'DELETE' })
    this.revision++
    this.data = { ...this.data, categories: this.data.categories.filter((item) => item.id !== id) }
    return this.data
  }

  async deleteBudget(month: string, name: string): Promise<FinanceData> {
    const category = this.data?.categories.find((item) => item.type === 'expense' && item.name === name)
    const budget = this.budgets.find((item) => item.category_id === category?.id && item.month === `${month}-01`)
    if (!this.data || !budget) throw new Error('Лимит не найден. Обновите данные.')
    await apiClient.request(`/budgets/${budget.id}`, { method: 'DELETE' })
    this.revision++
    this.budgets = this.budgets.filter((item) => item.id !== budget.id)
    this.data = { ...this.data, budgets: { ...this.data.budgets,
      [month]: Object.fromEntries(Object.entries(this.data.budgets[month] ?? {}).filter(([key]) => key !== name)),
    } }
    return this.data
  }

  async saveBudget(input: BudgetInput): Promise<FinanceData> {
    const category = this.data?.categories.find((item) => item.type === 'expense' && item.name === input.category)
    if (!this.data || !category) throw new Error('Выберите доступную расходную категорию.')
    const json = { category_id: category.id, month: `${input.month}-01`, limit_kopecks: input.amountKopecks }
    const previous = this.budgets.find((item) => item.category_id === category.id && item.month === json.month)
    let record: ApiBudget
    try {
      record = await apiClient.request<ApiBudget>(previous ? `/budgets/${previous.id}` : '/budgets', { method: previous ? 'PUT' : 'POST', json })
    } catch (error) {
      if (previous || !(error instanceof ApiError) || error.status !== 409) throw error
      // Another tab may have created this monthly limit after the last load.
      const existing = await apiClient.request<ApiBudget[]>(`/budgets?category_id=${category.id}&month=${json.month}`)
      if (!existing[0]) throw error
      record = await apiClient.request<ApiBudget>(`/budgets/${existing[0].id}`, { method: 'PUT', json })
    }
    this.revision++
    this.budgets = [...this.budgets.filter((item) => item.id !== record.id), record]
    this.data = { ...this.data, budgets: { ...this.data.budgets, [input.month]: { ...this.data.budgets[input.month], [input.category]: record.limit_kopecks } } }
    return this.data
  }
}
