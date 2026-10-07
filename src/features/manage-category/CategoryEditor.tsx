import { useId, useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material'
import type { Category, TransactionType } from '../../entities/finance/model/types'
import { useFinance } from '../../entities/finance/model/use-finance'
import { useAsyncAction } from '../../shared/lib/use-async-action'

type Props = {
  categories: Category[]
  initial?: Category
  fixedType?: TransactionType
  label?: string
  disabled?: boolean
  onSaved?: (name: string) => void
}

export default function CategoryEditor({ categories, initial, fixedType, label, disabled, onSaved }: Props) {
  const { addCategory, updateCategory } = useFinance()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [validation, setValidation] = useState('')
  const { pending, error, run, clearError } = useAsyncAction()
  const titleId = useId()
  const fieldId = useId()
  function close() { if (!pending) setOpen(false) }

  return <>
    <Button disabled={disabled} sx={{ alignSelf: 'flex-start' }} onClick={() => {
      setName(initial?.name ?? '')
      setType(initial?.type ?? fixedType ?? 'expense')
      setValidation('')
      clearError()
      setOpen(true)
    }}>{label ?? (initial ? 'Редактировать' : 'Добавить категорию')}</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs" aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{initial ? 'Редактирование категории' : `Новая категория ${type === 'expense' ? 'расходов' : 'доходов'}`}</DialogTitle>
      <form noValidate onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (pending) return
        const trimmed = name.trim()
        if (!trimmed || trimmed.length > 80) { setValidation('Введите название от 1 до 80 символов.'); return }
        if (categories.some((item) => item.id !== initial?.id && item.type === type && item.name === trimmed)) {
          setValidation('Категория с таким названием уже существует.'); return
        }
        void run(() => initial ? updateCategory(initial.id, { name: trimmed, type }) : addCategory({ name: trimmed, type }), () => {
          onSaved?.(trimmed)
          setOpen(false)
        })
      }}>
        <DialogContent>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField id={`${fieldId}-name`} label="Название категории" autoFocus fullWidth disabled={pending} value={name}
              error={Boolean(validation)} helperText={validation || 'До 80 символов.'}
              onChange={(event) => { setName(event.target.value); setValidation(''); clearError() }} />
            {!fixedType && <TextField id={`${fieldId}-type`} select label="Тип категории" value={type} disabled={pending}
              onChange={(event) => { setType(event.target.value as TransactionType); setValidation(''); clearError() }}
              helperText={initial ? 'Тип можно изменить, если у категории нет операций и бюджетов.' : undefined}>
              <MenuItem value="expense">Расход</MenuItem><MenuItem value="income">Доход</MenuItem>
            </TextField>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={close}>Отмена</Button>
          <Button type="submit" variant="contained" loading={pending}>{initial ? 'Сохранить категорию' : 'Добавить категорию'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  </>
}
