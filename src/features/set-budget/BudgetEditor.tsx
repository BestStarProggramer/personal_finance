import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Box, Button, Collapse, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import type { BudgetInput, Category } from '../../entities/finance/model/types'
import { parseAmount } from '../../shared/lib/money'
import { useAsyncAction } from '../../shared/lib/use-async-action'
import { validateBudget } from './validation'
import MonthPicker from '../../shared/ui/MonthPicker'
import CategoryCreator from '../create-category/CategoryCreator'

type Props = { categories: string[]; categoryRecords: Category[]; month: string; onMonthChange: (month: string) => void; onSave: (budget: BudgetInput) => Promise<void> }

export default function BudgetEditor({ categories, categoryRecords, month, onMonthChange, onSave }: Props) {
  const [category, setCategory] = useState(categories.includes('Продукты') ? 'Продукты' : categories[0] ?? '')
  const [amount, setAmount] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saved, setSaved] = useState(false)
  const { pending, error, run, clearError } = useAsyncAction()
  const errors = submitted ? validateBudget({ month, category, amount }, categories) : {}

  function edit() { setSaved(false); clearError() }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setSubmitted(true)
    setSaved(false)
    const validation = validateBudget({ month, category, amount }, categories)
    const parsed = parseAmount(amount)
    const firstError = Object.keys(validation)[0]
    if (firstError || parsed === null) { document.getElementById(`budget-${firstError}`)?.focus(); return }
    void run(() => onSave({ month, category, amountKopecks: parsed }), () => {
      setSaved(true)
      setSubmitted(false)
      setAmount('')
    })
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h6" component="h2" gutterBottom>Задать или изменить лимит</Typography>
      <Stack component="form" noValidate onSubmit={save} spacing={2} aria-busy={pending}>
        <Box component="fieldset" disabled={pending} sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' }, gap: 2, alignItems: 'start' }}>
          <MonthPicker id="budget-month" required value={month} disabled={pending}
            onChange={(value) => { onMonthChange(value); edit() }} error={Boolean(errors.month)} helperText={errors.month} />
          <Stack spacing={0.5}>
            <TextField id="budget-category" required select label="Категория" value={category} disabled={pending}
              onChange={(event) => { setCategory(event.target.value); edit() }} error={Boolean(errors.category)} helperText={errors.category}>
              {categories.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <CategoryCreator categories={categoryRecords} type="expense" disabled={pending} onCreated={(name) => { setCategory(name); edit() }} />
          </Stack>
          <TextField id="budget-amount" required label="Лимит, ₽" value={amount} slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            onChange={(event) => { setAmount(event.target.value); edit() }} error={Boolean(errors.amount)}
            helperText={errors.amount || 'Новый лимит заменит прежний для выбранного месяца.'} />
          <Button variant="contained" type="submit" loading={pending} sx={{ minHeight: 56 }}>Сохранить лимит</Button>
        </Box>
        <Collapse in={submitted && Object.keys(errors).length > 0} unmountOnExit><Alert severity="error">Проверьте выделенные поля.</Alert></Collapse>
        <Collapse in={Boolean(error)} unmountOnExit><Alert severity="error">{error}</Alert></Collapse>
        <Collapse in={saved} unmountOnExit><Alert severity="success">Лимит сохранён.</Alert></Collapse>
      </Stack>
    </Paper>
  )
}
