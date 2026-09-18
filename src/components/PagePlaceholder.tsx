import type { ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'

type PagePlaceholderProps = {
  title: string
  description: string
  children?: ReactNode
}

export default function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
      <Typography variant="h1" gutterBottom>{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 640 }}>{description}</Typography>
      {children && <Box sx={{ mt: 3 }}>{children}</Box>}
    </Paper>
  )
}
