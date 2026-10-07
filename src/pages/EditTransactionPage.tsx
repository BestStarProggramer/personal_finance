import { Link, useNavigate, useParams } from 'react-router'
import { Button, Paper, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import TransactionForm from '../features/create-transaction/TransactionForm'
import AsyncContent from '../shared/ui/AsyncContent'
import PageMessage from '../shared/ui/PageMessage'

export default function EditTransactionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { state, retry, updateTransaction } = useFinance()
  return <AsyncContent state={state} onRetry={retry}>
    {({ transactions, categories }) => {
      const transaction = transactions.find((item) => item.id === id)
      if (!transaction) return <PageMessage title="Операция недоступна" description="Запись удалена или у вас нет доступа к ней.">
        <Button component={Link} to="/transactions">Вернуться к операциям</Button>
        <Button onClick={retry}>Обновить данные</Button>
      </PageMessage>
      return <Paper component="section" variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h1" gutterBottom>Редактирование операции</Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>Измените данные и сохраните. Итоги и бюджеты пересчитаются.</Typography>
        <TransactionForm key={id} categories={categories} initial={transaction}
          onSave={(input) => updateTransaction(id, input)} onSaved={() => navigate('/transactions', { replace: true })} />
      </Paper>
    }}
  </AsyncContent>
}
