import { Alert, Button, Paper, Stack, Typography } from '@mui/material'

type Props = { error?: string; onRetry: () => void }
export default function SessionStatus({ error, onRetry }: Props) {
  return <Paper variant="outlined" sx={{ p: 3 }}><Stack spacing={2}>
    {error ? <><Alert severity="error">{error}</Alert><Button onClick={onRetry}>Повторить проверку сессии</Button></> : <Typography role="status">Проверка сессии…</Typography>}
  </Stack></Paper>
}
