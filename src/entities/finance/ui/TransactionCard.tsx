import { Box, Chip, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { Transaction } from '../model/types'
import { formatDate } from '../../../shared/lib/date'
import { formatMoney } from '../../../shared/lib/money'

export default function TransactionCard({ transaction, actions }: { transaction: Transaction; actions?: ReactNode }) {
  return (
    <Paper component="li" variant="outlined" sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <Typography sx={{ fontWeight: 600 }}>{transaction.category}</Typography>
          <Typography variant="body2" color="text.secondary">{formatDate(transaction.date)}</Typography>
          {transaction.comment && <Typography sx={{ mt: 1 }}>{transaction.comment}</Typography>}
        </Box>
        <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0 }}>
          <Chip size="small" variant="outlined" label={transaction.type === 'income' ? 'Доход' : 'Расход'} />
          <Typography sx={{ fontWeight: 700 }} color={transaction.type === 'income' ? 'primary.main' : 'text.primary'}>
            {transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amountKopecks)}
          </Typography>
        </Stack>
      </Stack>
      {actions && <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>{actions}</Stack>}
    </Paper>
  )
}
