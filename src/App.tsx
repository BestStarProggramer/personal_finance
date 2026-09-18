import { Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { useState } from 'react'
import { createDemoTransactions } from './data/transactions'
import type { Transaction } from './data/transactions'
import TransactionsPage from './pages/TransactionsPage'
import NewTransactionPage from './pages/NewTransactionPage'
import { OverviewPage, BudgetsPage, SettingsPage, NotFoundPage } from './pages/Pages'
import './App.css'

export default function App() {
  const [transactions, setTransactions] = useState(createDemoTransactions)

  function addTransaction(transaction: Omit<Transaction, 'id'>) {
    const record = { ...transaction, id: crypto.randomUUID() }
    setTransactions((current) => [record, ...current])
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage />} />
        <Route path="transactions" element={<TransactionsPage transactions={transactions} />} />
        <Route path="transactions/new" element={<NewTransactionPage onAdd={addTransaction} />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
