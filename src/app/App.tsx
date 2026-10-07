import { Route, Routes } from 'react-router'
import AppLayout from './AppLayout'
import AuthProvider from './providers/AuthProvider'
import FinanceScope from './providers/FinanceScope'
import RequireAuth from './RequireAuth'
import AuthPage from '../pages/AuthPage'
import TransactionsPage from '../pages/TransactionsPage'
import NewTransactionPage from '../pages/NewTransactionPage'
import NotFoundPage from '../pages/NotFoundPage'
import OverviewPage from '../pages/OverviewPage'
import BudgetsPage from '../pages/BudgetsPage'
import SettingsPage from '../pages/SettingsPage'
import EditTransactionPage from '../pages/EditTransactionPage'
import CategoriesPage from '../pages/CategoriesPage'
import './app.css'

export default function App() {
  return (
    <AuthProvider>
      <FinanceScope>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="login" element={<AuthPage />} />
            <Route path="register" element={<AuthPage registration />} />
            <Route element={<RequireAuth />}>
              <Route index element={<OverviewPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="transactions/new" element={<NewTransactionPage />} />
              <Route path="transactions/:id/edit" element={<EditTransactionPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
            </Route>
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </FinanceScope>
    </AuthProvider>
  )
}
