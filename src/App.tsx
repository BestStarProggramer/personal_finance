import { Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { OverviewPage, TransactionsPage, NewTransactionPage, BudgetsPage, SettingsPage, NotFoundPage } from './pages/Pages'
import './App.css'

export default function App() {
  return (
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
  )
}
