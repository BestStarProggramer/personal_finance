import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Collapse, MenuItem, Stack, TextField } from '@mui/material'
import { categories } from '../../entities/finance/model/types'
import type { NewTransaction, TransactionType } from '../../entities/finance/model/types'
import { localDate } from '../../shared/lib/date'
import { parseAmount } from '../../shared/lib/money'
import { useAsyncAction } from '../../shared/lib/use-async-action'
import { validateTransaction } from './validation'
import type { TransactionDraft } from './validation'

type Props = { onSave: (transaction: NewTransaction) => Promise<void>; onSaved: () => void }

export default function TransactionForm({ onSave, onSaved }: Props) {
  const [draft, setDraft] = useState<TransactionDraft>(() => ({ type: 'expense', amount: '', category: '', date: localDate(), comment: '' }))
  const [submitted, setSubmitted] = useState(false)
  const { pending, error, run, clearError } = useAsyncAction()
  const errors = submitted ? validateTransaction(draft) : {}

  function change(patch: Partial<TransactionDraft>) {
    clearError()
    setDraft((current) => ({ ...current, ...patch }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setSubmitted(true)
    const validation = validateTransaction(draft)
    const amountKopecks = parseAmount(draft.amount)
    const firstError = Object.keys(validation)[0]
    if (firstError || amountKopecks === null) {
      document.getElementById(`transaction-${firstError}`)?.focus()
      return
    }
    void run(() => onSave({ type: draft.type, category: draft.category, date: draft.date, comment: draft.comment.trim(), amountKopecks }), onSaved)
  }

  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={2} sx={{ maxWidth: 560 }} aria-busy={pending}>
      <Collapse in={submitted && Object.keys(errors).length > 0} unmountOnExit><Alert severity="error">Проверьте выделенные поля.</Alert></Collapse>
      <Collapse in={Boolean(error)} unmountOnExit><Alert severity="error">{error}</Alert></Collapse>
      <Stack component="fieldset" disabled={pending} spacing={3} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <TextField id="transaction-type" select required label="Тип операции" value={draft.type} disabled={pending}
          onChange={(event) => change({ type: event.target.value as TransactionType, category: '' })}>
          <MenuItem value="expense">Расход</MenuItem><MenuItem value="income">Доход</MenuItem>
        </TextField>
        <TextField id="transaction-amount" required label="Сумма, ₽" value={draft.amount}
          slotProps={{ htmlInput: { inputMode: 'decimal' } }} onChange={(event) => change({ amount: event.target.value })}
          error={Boolean(errors.amount)} helperText={errors.amount || 'Например: 1250,50'} />
        <TextField id="transaction-category" select required label="Категория" value={draft.category}
          onChange={(event) => change({ category: event.target.value })} error={Boolean(errors.category)} helperText={errors.category} disabled={pending}>
          {categories[draft.type].map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
        </TextField>
        <TextField id="transaction-date" required label="Дата" type="date" value={draft.date}
          slotProps={{ inputLabel: { shrink: true } }} onChange={(event) => change({ date: event.target.value })}
          error={Boolean(errors.date)} helperText={errors.date} />
        <TextField id="transaction-comment" label="Комментарий" multiline minRows={2} value={draft.comment}
          onChange={(event) => change({ comment: event.target.value })} error={Boolean(errors.comment)} helperText={errors.comment || 'Необязательно, до 200 символов.'} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button type="submit" variant="contained" loading={pending}>Сохранить операцию</Button>
          <Button component={Link} to="/transactions" variant="outlined" disabled={pending}>Отмена</Button>
        </Stack>
      </Stack>
    </Stack>
  )
}
