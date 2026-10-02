import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

type Props = { title: string; description: string; action?: ReactNode }

export default function EmptyState({ title, description, action }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
      <Typography component="h2" variant="h6" gutterBottom>{title}</Typography>
      <Typography color="text.secondary">{description}</Typography>
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Paper>
  )
}
