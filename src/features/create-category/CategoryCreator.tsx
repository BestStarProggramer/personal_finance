import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import type { Category, TransactionType } from '../../entities/finance/model/types'
import { useFinance } from '../../entities/finance/model/use-finance'
import { useAsyncAction } from '../../shared/lib/use-async-action'

type Props = { categories: Category[]; type: TransactionType; disabled?: boolean; onCreated: (name: string) => void }

export default function CategoryCreator({ categories, type, disabled, onCreated }: Props) {
  const { addCategory } = useFinance()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [validation, setValidation] = useState('')
  const { pending, error, run, clearError } = useAsyncAction()

  function close() { if (!pending) setOpen(false) }

  return <>
    <Button disabled={disabled} sx={{ alignSelf: 'flex-start' }} onClick={() => {
      setName(''); setValidation(''); clearError(); setOpen(true)
    }}>Добавить свою категорию</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>Новая категория {type === 'expense' ? 'расходов' : 'доходов'}</DialogTitle>
      <form noValidate onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (pending) return
        const trimmed = name.trim()
        if (!trimmed || trimmed.length > 80) { setValidation('Введите название от 1 до 80 символов.'); return }
        if (categories.some((item) => item.type === type && item.name === trimmed)) { setValidation('Категория с таким названием уже существует.'); return }
        void run(() => addCategory({ name: trimmed, type }), () => { onCreated(trimmed); setOpen(false) })
      }}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField id="category-name" label="Название категории" autoFocus fullWidth disabled={pending} value={name}
            error={Boolean(validation)} helperText={validation || 'До 80 символов.'}
            onChange={(event) => { setName(event.target.value); setValidation(''); clearError() }} />
        </DialogContent>
        <DialogActions>
          <Button disabled={pending} onClick={close}>Отмена</Button>
          <Button type="submit" variant="contained" loading={pending}>Добавить категорию</Button>
        </DialogActions>
      </form>
    </Dialog>
  </>
}
