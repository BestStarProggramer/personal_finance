export type TransactionType = 'income' | 'expense'
export type Category = { id: string; name: string; type: TransactionType }

export const categories: Record<TransactionType, readonly string[]> = {
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

export type NewTransaction = Omit<Transaction, 'id'>
export type TransactionFilters = { month: string; date?: string; dateFrom?: string; dateTo?: string; type: TransactionType | ''; category: string }
export type Budgets = Record<string, Record<string, number>>
export type FinanceData = { transactions: Transaction[]; budgets: Budgets; categories: Category[] }
export type BudgetInput = { month: string; category: string; amountKopecks: number }

export interface FinanceRepository {
  load(signal: AbortSignal): Promise<FinanceData>
  addTransaction(transaction: NewTransaction): Promise<FinanceData>
  saveBudget(budget: BudgetInput): Promise<FinanceData>
}
