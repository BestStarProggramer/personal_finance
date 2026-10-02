import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import { filterTransactions } from '../entities/finance/model/filter'
import type { TransactionFilters as Filters } from '../entities/finance/model/types'
import TransactionCard from '../entities/finance/ui/TransactionCard'
import TransactionFilters from '../features/filter-transactions/TransactionFilters'
import AsyncContent from '../shared/ui/AsyncContent'
import EmptyState from '../shared/ui/EmptyState'

const emptyFilters: Filters = { month: '', type: '', category: '' }

export default function TransactionsPage() {
  const { state, retry } = useFinance()
  const [filters, setFilters] = useState(emptyFilters)
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Typography variant="h1">Операции</Typography>
        <Button component={Link} to="/transactions/new" variant="contained">Добавить операцию</Button>
      </Stack>
      <Alert severity="info" sx={{ mb: 3 }}>Демонстрационные данные. После обновления страницы изменения сбросятся.</Alert>
      <AsyncContent state={state} onRetry={retry}>
        {({ transactions }) => {
          const visible = filterTransactions(transactions, filters)
          return <>
            <TransactionFilters value={filters} onChange={setFilters} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
              <Typography variant="body2" role="status">Найдено: {visible.length}</Typography>
              <Button onClick={() => setFilters(emptyFilters)}>Сбросить фильтры</Button>
            </Stack>
            {visible.length === 0 ? <EmptyState title="Операции не найдены." description={transactions.length ? 'Измените фильтры или добавьте запись.' : 'Добавьте первую операцию, чтобы начать учёт доходов и расходов.'} /> : (
              <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {visible.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)}
              </Stack>
            )}
          </>
        }}
      </AsyncContent>
    </Paper>
  )
}
