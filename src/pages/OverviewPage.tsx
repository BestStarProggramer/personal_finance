import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, Box, Button, LinearProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { formatDate, localDate } from '../shared/lib/date'
import { formatMoney } from '../shared/lib/money'
import type { Transaction } from '../entities/finance/model/types'
import { summarizeMonth } from '../entities/finance/model/summary'
import { useFinance } from '../entities/finance/model/use-finance'
import AsyncContent from '../shared/ui/AsyncContent'
import EmptyState from '../shared/ui/EmptyState'

export default function OverviewPage() {
  const { state, retry } = useFinance()
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box><Typography variant="h1">Обзор</Typography><Typography color="text.secondary">Ваши финансы за выбранный месяц</Typography></Box>
        <TextField id="overview-month" label="Месяц" type="month" value={month} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => { if (event.target.value) setMonth(event.target.value) }} />
      </Stack>
      <AsyncContent state={state} onRetry={retry}>
        {({ transactions }) => <OverviewSummary transactions={transactions} month={month} />}
      </AsyncContent>
    </Stack>
  )
}

function OverviewSummary({ transactions, month }: { transactions: Transaction[]; month: string }) {
  const summary = summarizeMonth(transactions, month)
  return (
    <Stack spacing={3}>
      {!summary.records.length && <EmptyState title="Операций за этот месяц нет" description="Добавьте доход или расход, чтобы увидеть итоги и распределение расходов."
        action={<Button component={Link} to="/transactions/new" variant="contained">Добавить операцию</Button>} />}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
        {([{ label: 'Доходы', value: summary.income }, { label: 'Расходы', value: summary.expense }, { label: 'Разница за месяц', value: summary.balance }]).map(({ label, value }) => (
          <Paper variant="outlined" key={label} sx={{ p: 3, minWidth: 0 }}>
            <Typography color="text.secondary">{label}</Typography>
            <Typography data-testid={label === 'Расходы' ? 'expense-total' : undefined} sx={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700, overflowWrap: 'anywhere', mt: 1 }}>{formatMoney(value)}</Typography>
          </Paper>
        ))}
      </Box>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>Расходы по категориям</Typography>
        {summary.expense === 0 ? <Alert severity="info">В этом месяце пока нет расходов.</Alert> : (
          <Stack spacing={2}>
            {summary.byCategory.filter((item) => item.amount > 0).map(({ category, amount }) => (
              <Box key={category}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}><Typography>{category}</Typography><Typography>{formatMoney(amount)}</Typography></Stack>
                <LinearProgress aria-label={category} variant="determinate" value={amount / summary.expense * 100} sx={{ height: 8, borderRadius: 1 }} />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>Последние операции месяца</Typography>
        {summary.records.length === 0 ? <Typography color="text.secondary">Операций за этот месяц нет.</Typography> : (
          <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0 }}>
            {summary.records.slice(0, 5).map((item) => (
              <Box component="li" key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box><Typography>{item.category}</Typography><Typography variant="body2" color="text.secondary">{formatDate(item.date)}</Typography></Box>
                <Typography sx={{ fontWeight: 600 }}>{item.type === 'income' ? '+' : '−'}{formatMoney(item.amountKopecks)}</Typography>
              </Box>
            ))}
          </Stack>
        )}
        <Button component={Link} to="/transactions">Все операции →</Button>
      </Paper>
    </Stack>
  )
}
