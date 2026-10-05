import { Alert, Button, Stack } from '@mui/material'
import { useAsyncAction } from '../../shared/lib/use-async-action'

export default function LogoutButton({ onLogout }: { onLogout: () => Promise<void> }) {
  const { pending, error, run } = useAsyncAction()
  return <Stack spacing={1}>
    <Button variant="outlined" loading={pending} onClick={() => void run(onLogout, () => {})}>Выйти</Button>
    {error && <Alert severity="error">{error}</Alert>}
  </Stack>
}
