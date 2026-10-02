import { useState } from 'react'
import { Box, Stack, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import { summarizeMonth } from '../entities/finance/model/summary'
import BudgetCard from '../entities/finance/ui/BudgetCard'
import BudgetEditor from '../features/set-budget/BudgetEditor'
import { isValidMonth, localDate } from '../shared/lib/date'
import AsyncContent from '../shared/ui/AsyncContent'
import EmptyState from '../shared/ui/EmptyState'

export default function BudgetsPage() {
  const { state, retry, saveBudget } = useFinance()
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  return (
    <Stack spacing={3}>
      <Box><Typography variant="h1">Бюджеты</Typography><Typography color="text.secondary">Месячные лимиты расходов по категориям</Typography></Box>
      <AsyncContent state={state} onRetry={retry}>
        {({ transactions, budgets }) => <>
          <BudgetEditor month={month} onMonthChange={setMonth} onSave={saveBudget} />
          {isValidMonth(month) && <>
            {!Object.keys(budgets[month] ?? {}).length && <EmptyState title="Бюджеты на этот месяц не заданы" description="Выберите категорию и сохраните лимит в форме выше. Расходы уже учитываются в карточках." />}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
              {summarizeMonth(transactions, month).byCategory.map(({ category, amount }) => (
                <BudgetCard key={category} category={category} spent={amount} limit={budgets[month]?.[category]} />
              ))}
            </Box>
          </>}
          <Typography variant="body2" color="text.secondary">Лимиты и операции сохраняются до обновления страницы.</Typography>
        </>}
      </AsyncContent>
    </Stack>
  )
}
