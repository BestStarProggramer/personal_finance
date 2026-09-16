import { NavLink, Outlet } from 'react-router'

const navigation = [
  { to: '/', label: 'Обзор' },
  { to: '/transactions', label: 'Операции' },
  { to: '/budgets', label: 'Бюджеты' },
  { to: '/settings', label: 'Настройки' },
]

export default function AppLayout() {
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <header className="app-header">
        <p className="app-brand">Личный бюджет</p>
        <nav aria-label="Основная навигация">
          {navigation.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}
