import { Route, Routes } from 'react-router'
import AppLayout from './AppLayout'
import FinanceProvider from './providers/FinanceProvider'
import TransactionsPage from '../pages/TransactionsPage'
import NewTransactionPage from '../pages/NewTransactionPage'
import NotFoundPage from '../pages/NotFoundPage'
import OverviewPage from '../pages/OverviewPage'
import BudgetsPage from '../pages/BudgetsPage'
import SettingsPage from '../pages/SettingsPage'
import './app.css'

export default function App() {
  return (
    <FinanceProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/new" element={<NewTransactionPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </FinanceProvider>
  )
}
