import { Route, Routes } from 'react-router'
import AppLayout from './components/AppLayout'
import { useState } from 'react'
import { createDemoTransactions } from './data/transactions'
import type { Transaction } from './data/transactions'
import TransactionsPage from './pages/TransactionsPage'
import NewTransactionPage from './pages/NewTransactionPage'
import { NotFoundPage } from './pages/Pages'
import OverviewPage from './pages/OverviewPage'
import BudgetsPage from './pages/BudgetsPage'
import SettingsPage from './pages/SettingsPage'
import { createDemoBudgets } from './data/summary'
import './App.css'

export default function App() {
  const [transactions, setTransactions] = useState(createDemoTransactions)
  const [budgets, setBudgets] = useState(createDemoBudgets)

  function saveBudget(month: string, category: string, amount: number) {
    setBudgets((current) => ({ ...current, [month]: { ...current[month], [category]: amount } }))
  }

  function addTransaction(transaction: Omit<Transaction, 'id'>) {
    const record = { ...transaction, id: crypto.randomUUID() }
    setTransactions((current) => [record, ...current])
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OverviewPage transactions={transactions} />} />
        <Route path="transactions" element={<TransactionsPage transactions={transactions} />} />
        <Route path="transactions/new" element={<NewTransactionPage onAdd={addTransaction} />} />
        <Route path="budgets" element={<BudgetsPage transactions={transactions} budgets={budgets} onSave={saveBudget} />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
