import { LinearProgress, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { formatMoney } from '../../../shared/lib/money'

type Props = { category: string; spent: number; limit?: number; actions?: ReactNode }

export default function BudgetCard({ category, spent, limit, actions }: Props) {
  const exceeded = limit !== undefined && spent > limit
  return (
    <Paper component="section" aria-label={category} variant="outlined" sx={{ p: 3, minWidth: 0, overflowWrap: 'anywhere' }}>
      <Typography variant="h6" component="h2">{category}</Typography>
      <Typography sx={{ my: 1 }}>Потрачено: {formatMoney(spent)}</Typography>
      {limit === undefined ? <Typography color="text.secondary">Лимит не задан</Typography> : <>
        <Typography color="text.secondary">Лимит: {formatMoney(limit)}</Typography>
        <LinearProgress aria-label={`Использование бюджета: ${category}`} variant="determinate" value={Math.min(spent / limit * 100, 100)} color={exceeded ? 'error' : 'primary'} sx={{ height: 8, borderRadius: 1, my: 2 }} />
        <Typography color={exceeded ? 'error.main' : 'text.secondary'}>{exceeded ? 'Превышение' : 'Осталось'}: {formatMoney(Math.abs(limit - spent))}</Typography>
      </>}
      {actions}
    </Paper>
  )
}
