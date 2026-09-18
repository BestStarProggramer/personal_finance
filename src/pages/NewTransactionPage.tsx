import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { categories, localDate, parseAmount, validateTransaction } from '../data/transactions'
import type { Transaction, TransactionDraft, TransactionType } from '../data/transactions'

export default function NewTransactionPage({ onAdd }: { onAdd: (transaction: Omit<Transaction, 'id'>) => void }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<TransactionDraft>(() => ({
    type: 'expense', amount: '', category: '', date: localDate(), comment: '',
  }))
  const [submitted, setSubmitted] = useState(false)
  const errors = submitted ? validateTransaction(draft) : {}

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const amountKopecks = parseAmount(draft.amount)
    if (Object.keys(validateTransaction(draft)).length || amountKopecks === null) return
    onAdd({ type: draft.type, category: draft.category, date: draft.date, comment: draft.comment.trim(), amountKopecks })
    navigate('/transactions', { replace: true })
  }

  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1" gutterBottom>Новая операция</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Запишите доход или расход. Сумма указывается в рублях.</Typography>
      <Stack component="form" noValidate onSubmit={submit} spacing={3} sx={{ maxWidth: 560 }}>
        {submitted && Object.keys(errors).length > 0 && <Alert severity="error">Проверьте выделенные поля.</Alert>}
        <TextField id="transaction-type" select required label="Тип операции" value={draft.type}
          onChange={(event) => setDraft({ ...draft, type: event.target.value as TransactionType, category: '' })}>
          <MenuItem value="expense">Расход</MenuItem>
          <MenuItem value="income">Доход</MenuItem>
        </TextField>
        <TextField id="transaction-amount" required label="Сумма, ₽" value={draft.amount}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
          error={Boolean(errors.amount)} helperText={errors.amount || 'Например: 1250,50'} />
        <TextField id="transaction-category" select required label="Категория" value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          error={Boolean(errors.category)} helperText={errors.category}>
          {categories[draft.type].map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
        </TextField>
        <TextField id="transaction-date" required label="Дата" type="date" value={draft.date}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(event) => setDraft({ ...draft, date: event.target.value })}
          error={Boolean(errors.date)} helperText={errors.date} />
        <TextField id="transaction-comment" label="Комментарий" multiline minRows={2} value={draft.comment}
          onChange={(event) => setDraft({ ...draft, comment: event.target.value })}
          error={Boolean(errors.comment)} helperText={errors.comment || 'Необязательно, до 200 символов.'} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button type="submit" variant="contained">Сохранить операцию</Button>
          <Button component={Link} to="/transactions" variant="outlined">Отмена</Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
