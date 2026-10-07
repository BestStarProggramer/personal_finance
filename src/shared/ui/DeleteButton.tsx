import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { useAsyncAction } from '../lib/use-async-action'

type Props = { label: string; title: string; description: string; onDelete: () => Promise<void>; onDeleted?: () => void }

export default function DeleteButton({ label, title, description, onDelete, onDeleted }: Props) {
  const [open, setOpen] = useState(false)
  const { pending, error, run, clearError } = useAsyncAction()
  return <>
    <Button color="error" onClick={() => { clearError(); setOpen(true) }}>{label}</Button>
    <Dialog open={open} onClose={() => { if (!pending) setOpen(false) }} fullWidth maxWidth="xs" aria-labelledby="delete-dialog-title">
      <DialogTitle id="delete-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={pending} onClick={() => setOpen(false)}>Отмена</Button>
        <Button color="error" variant="contained" loading={pending} onClick={() => {
          void run(onDelete, () => { setOpen(false); onDeleted?.() })
        }}>Удалить</Button>
      </DialogActions>
    </Dialog>
  </>
}
