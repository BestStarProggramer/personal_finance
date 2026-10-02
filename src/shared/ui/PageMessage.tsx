import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

type PageMessageProps = {
  title: string
  description: string
  children?: ReactNode
}

export default function PageMessage({ title, description, children }: PageMessageProps) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
      <Typography variant="h1" gutterBottom>{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 640 }}>{description}</Typography>
      {children && <Box sx={{ mt: 3 }}>{children}</Box>}
    </Paper>
  )
}
