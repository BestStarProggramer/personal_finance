import type { ReactNode } from 'react'
import { Alert, Button, Skeleton, Stack, Typography } from '@mui/material'
import type { AsyncState } from '../lib/async-state'

type Props<T> = { state: AsyncState<T>; onRetry: () => void; children: (data: T) => ReactNode }

export default function AsyncContent<T>({ state, onRetry, children }: Props<T>) {
  if (state.status === 'loading') return (
    <Stack spacing={2} role="status" aria-live="polite" aria-busy="true" aria-label="Загрузка данных">
      <Typography>Загрузка данных…</Typography>
      {[0, 1, 2].map((item) => <Skeleton key={item} variant="rounded" height={90} />)}
    </Stack>
  )
  if (state.status === 'error') return (
    <Stack spacing={2}>
      <Alert severity="error">{state.message}</Alert>
      <Button variant="outlined" onClick={onRetry} sx={{ alignSelf: 'flex-start' }}>Повторить загрузку</Button>
    </Stack>
  )
  return children(state.data)
}
