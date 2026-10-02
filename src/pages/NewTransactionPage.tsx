import { useNavigate } from 'react-router'
import { Paper, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import TransactionForm from '../features/create-transaction/TransactionForm'
import AsyncContent from '../shared/ui/AsyncContent'

export default function NewTransactionPage() {
  const navigate = useNavigate()
  const { state, retry, addTransaction } = useFinance()
  return (
    <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Typography variant="h1" gutterBottom>Новая операция</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Запишите доход или расход. Сумма указывается в рублях.</Typography>
      <AsyncContent state={state} onRetry={retry}>
        {() => <TransactionForm onSave={addTransaction} onSaved={() => navigate('/transactions', { replace: true })} />}
      </AsyncContent>
    </Paper>
  )
}
