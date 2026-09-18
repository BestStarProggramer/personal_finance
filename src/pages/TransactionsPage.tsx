import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { categories, filterTransactions, formatDate, formatMoney } from '../data/transactions'
import type { Transaction, TransactionFilters } from '../data/transactions'

const emptyFilters: TransactionFilters = { month: '', type: '', category: '' }

export default function TransactionsPage({ transactions }: { transactions: Transaction[] }) {
  const [filters, setFilters] = useState(emptyFilters)
  const visible = filterTransactions(transactions, filters)
  const availableCategories = filters.type === 'income' ? categories.income
    : filters.type === 'expense' ? categories.expense : [...categories.income, ...categories.expense]

  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, mb: 3 }}>
        <Typography variant="h1">Операции</Typography>
        <Button component={Link} to="/transactions/new" variant="contained">Добавить операцию</Button>
      </Stack>
      <Alert severity="info" sx={{ mb: 3 }}>Демонстрационные данные. После обновления страницы изменения сбросятся.</Alert>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        <TextField id="filter-month" label="Месяц" type="month" value={filters.month}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => setFilters({ ...filters, month: event.target.value })} />
        <TextField id="filter-type" select label="Тип операции" value={filters.type}
          onChange={(event) => setFilters({ ...filters, type: event.target.value, category: '' })}>
          <MenuItem value="">Все типы</MenuItem>
          <MenuItem value="income">Доход</MenuItem>
          <MenuItem value="expense">Расход</MenuItem>
        </TextField>
        <TextField id="filter-category" select label="Категория" value={filters.category}
          onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <MenuItem value="">Все категории</MenuItem>
          {availableCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
        </TextField>
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
        <Typography variant="body2" role="status">Найдено: {visible.length}</Typography>
        <Button onClick={() => setFilters(emptyFilters)}>Сбросить фильтры</Button>
      </Stack>
      {visible.length === 0 ? <Alert severity="info">Операции не найдены. Измените фильтры или добавьте запись.</Alert> : (
        <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {visible.map((transaction) => (
            <Paper component="li" key={transaction.id} variant="outlined" sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
                <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                  <Typography sx={{ fontWeight: 600 }}>{transaction.category}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatDate(transaction.date)}</Typography>
                  {transaction.comment && <Typography sx={{ mt: 1 }}>{transaction.comment}</Typography>}
                </Box>
                <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0 }}>
                  <Chip size="small" variant="outlined" label={transaction.type === 'income' ? 'Доход' : 'Расход'} />
                  <Typography sx={{ fontWeight: 700 }} color={transaction.type === 'income' ? 'primary.main' : 'text.primary'}>
                    {transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amountKopecks)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  )
}
