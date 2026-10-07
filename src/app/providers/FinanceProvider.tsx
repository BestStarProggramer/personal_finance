import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiFinanceRepository } from '../../entities/finance/api/api-repository'
import type { BudgetInput, Category, FinanceData, NewTransaction } from '../../entities/finance/model/types'
import type { AsyncState } from '../../shared/lib/async-state'
import { FinanceContext } from '../../entities/finance/model/context'

export default function FinanceProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(() => new ApiFinanceRepository())
  const [state, setState] = useState<AsyncState<FinanceData>>({ status: 'loading' })
  const request = useRef<AbortController | null>(null)

  const load = useCallback(() => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    void repository.load(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ status: 'ready', data }) },
      () => { if (!controller.signal.aborted) setState({ status: 'error', message: 'Не удалось загрузить данные. Проверьте соединение и повторите попытку.' }) },
    )
  }, [repository])

  useEffect(() => {
    load()
    return () => request.current?.abort()
  }, [load])

  function retry() {
    if (state.status === 'loading') return
    setState({ status: 'loading' })
    load()
  }

  async function addCategory(category: Omit<Category, 'id'>): Promise<void> {
    const data = await repository.addCategory(category)
    setState({ status: 'ready', data })
  }

  async function addTransaction(transaction: NewTransaction): Promise<void> {
    const data = await repository.addTransaction(transaction)
    setState({ status: 'ready', data })
  }

  async function saveBudget(budget: BudgetInput): Promise<void> {
    const data = await repository.saveBudget(budget)
    setState({ status: 'ready', data })
  }

  async function updateTransaction(id: string, transaction: NewTransaction): Promise<void> {
    setState({ status: 'ready', data: await repository.updateTransaction(id, transaction) })
  }

  async function deleteTransaction(id: string): Promise<void> {
    setState({ status: 'ready', data: await repository.deleteTransaction(id) })
  }

  async function updateCategory(id: string, category: Omit<Category, 'id'>): Promise<void> {
    setState({ status: 'ready', data: await repository.updateCategory(id, category) })
  }

  async function deleteCategory(id: string): Promise<void> {
    setState({ status: 'ready', data: await repository.deleteCategory(id) })
  }

  async function deleteBudget(month: string, category: string): Promise<void> {
    setState({ status: 'ready', data: await repository.deleteBudget(month, category) })
  }

  return <FinanceContext value={{ state, retry, addTransaction, addCategory, saveBudget,
    updateTransaction, deleteTransaction, updateCategory, deleteCategory, deleteBudget }}>{children}</FinanceContext>
}
