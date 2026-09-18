import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Box, Button, LinearProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { categories, formatMoney, localDate, parseAmount } from '../data/transactions'
import type { Transaction } from '../data/transactions'
import { summarizeMonth } from '../data/summary'
import type { Budgets } from '../data/summary'

type Props = { transactions: Transaction[]; budgets: Budgets; onSave: (month: string, category: string, amount: number) => void }

export default function BudgetsPage({ transactions, budgets, onSave }: Props) {
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  const [category, setCategory] = useState(categories.expense[0])
  const [amount, setAmount] = useState('')
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  const summary = summarizeMonth(transactions, month)

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = parseAmount(amount)
    setError(parsed === null)
    setSaved(false)
    if (parsed === null) return
    onSave(month, category, parsed)
    setSaved(true)
    setAmount('')
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box><Typography variant="h1">Бюджеты</Typography><Typography color="text.secondary">Месячные лимиты расходов по категориям</Typography></Box>
        <TextField id="budget-month" type="month" label="Месяц" value={month} slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => { if (event.target.value) { setMonth(event.target.value); setSaved(false) } }} />
      </Stack>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" component="h2" gutterBottom>Задать или изменить лимит</Typography>
        <Box component="form" noValidate onSubmit={save} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 2, alignItems: 'start' }}>
          <TextField id="budget-category" select label="Категория" value={category} onChange={(event) => { setCategory(event.target.value); setSaved(false) }}>
            {categories.expense.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
          </TextField>
          <TextField id="budget-amount" required label="Лимит, ₽" value={amount} slotProps={{ htmlInput: { inputMode: 'decimal' } }} onChange={(event) => { setAmount(event.target.value); setError(false); setSaved(false) }} error={error} helperText={error ? 'Введите положительную сумму, до 9 цифр и 2 знаков после запятой.' : 'Новый лимит заменит прежний для выбранного месяца.'} />
          <Button variant="contained" type="submit" sx={{ minHeight: 56 }}>Сохранить лимит</Button>
        </Box>
        {saved && <Alert severity="success" sx={{ mt: 2 }}>Лимит сохранён.</Alert>}
      </Paper>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {summary.byCategory.map(({ category: name, amount: spent }) => {
          const limit = budgets[month]?.[name]
          const exceeded = limit !== undefined && spent > limit
          return (
            <Paper component="section" aria-label={name} key={name} variant="outlined" sx={{ p: 3, minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography variant="h6" component="h2">{name}</Typography>
              <Typography sx={{ my: 1 }}>Потрачено: {formatMoney(spent)}</Typography>
              {limit === undefined ? <Typography color="text.secondary">Лимит не задан</Typography> : <>
                <Typography color="text.secondary">Лимит: {formatMoney(limit)}</Typography>
                <LinearProgress aria-label={`Использование бюджета: ${name}`} variant="determinate" value={Math.min(spent / limit * 100, 100)} color={exceeded ? 'error' : 'primary'} sx={{ height: 8, borderRadius: 1, my: 2 }} />
                <Typography color={exceeded ? 'error.main' : 'text.secondary'}>{exceeded ? 'Превышение' : 'Осталось'}: {formatMoney(Math.abs(limit - spent))}</Typography>
              </>}
            </Paper>
          )
        })}
      </Box>
      <Typography variant="body2" color="text.secondary">Лимиты и операции сохраняются до обновления страницы.</Typography>
    </Stack>
  )
}
