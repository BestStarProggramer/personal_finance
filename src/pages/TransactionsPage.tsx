import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import { filterTransactions } from '../entities/finance/model/filter'
import type { TransactionFilters as Filters } from '../entities/finance/model/types'
import TransactionCard from '../entities/finance/ui/TransactionCard'
import TransactionFilters from '../features/filter-transactions/TransactionFilters'
import AsyncContent from '../shared/ui/AsyncContent'
import EmptyState from '../shared/ui/EmptyState'
import DeleteButton from '../shared/ui/DeleteButton'
import { formatMoney } from '../shared/lib/money'

const emptyFilters: Filters = { month: '', date: '', type: '', category: '' }

export default function TransactionsPage() {
  const { state, retry, deleteTransaction } = useFinance()
  const [filters, setFilters] = useState(emptyFilters)
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Typography variant="h1">Операции</Typography>
        <Button component={Link} to="/transactions/new" variant="contained">Добавить операцию</Button>
        <Button onClick={retry} disabled={state.status === 'loading'}>Обновить данные</Button>
      </Stack>
      <AsyncContent state={state} onRetry={retry}>
        {({ transactions, categories }) => {
          const visible = filterTransactions(transactions, filters)
          return <>
            <TransactionFilters categories={categories} value={filters} onChange={setFilters} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
              <Typography variant="body2" role="status">Найдено: {visible.length}</Typography>
              <Button onClick={() => setFilters(emptyFilters)}>Сбросить фильтры</Button>
            </Stack>
            {visible.length === 0 ? <EmptyState title="Операции не найдены." description={transactions.length ? 'Измените фильтры или добавьте запись.' : 'Добавьте первую операцию, чтобы начать учёт доходов и расходов.'} /> : (
              <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {visible.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} actions={<>
                  <Button component={Link} to={`/transactions/${transaction.id}/edit`}>Редактировать</Button>
                  <DeleteButton label="Удалить операцию" title="Удалить операцию?"
                    description={`${transaction.category}: ${formatMoney(transaction.amountKopecks)}. Итоги месяца и бюджеты пересчитаются.`}
                    onDelete={() => deleteTransaction(transaction.id)} />
                </>} />)}
              </Stack>
            )}
          </>
        }}
      </AsyncContent>
    </Paper>
  )
}
