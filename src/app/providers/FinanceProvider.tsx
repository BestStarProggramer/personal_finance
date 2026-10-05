import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiFinanceRepository } from '../../entities/finance/api/api-repository'
import type { BudgetInput, FinanceData, NewTransaction } from '../../entities/finance/model/types'
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

  async function addTransaction(transaction: NewTransaction): Promise<void> {
    const data = await repository.addTransaction(transaction)
    setState({ status: 'ready', data })
  }

  async function saveBudget(budget: BudgetInput): Promise<void> {
    const data = await repository.saveBudget(budget)
    setState({ status: 'ready', data })
  }

  return <FinanceContext value={{ state, retry, addTransaction, saveBudget }}>{children}</FinanceContext>
}
