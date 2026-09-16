import { Link } from 'react-router'
import PagePlaceholder from '../components/PagePlaceholder'

export function OverviewPage() {
  return (
    <PagePlaceholder title="Обзор" description="Здесь появятся доходы, расходы и итоги за выбранный месяц.">
      <Link to="/transactions">Перейти к операциям →</Link>
    </PagePlaceholder>
  )
}

export function TransactionsPage() {
  return (
    <PagePlaceholder title="Операции" description="Здесь появится список доходов и расходов с фильтрами.">
      <Link to="/transactions/new">Добавить операцию →</Link>
    </PagePlaceholder>
  )
}

export function NewTransactionPage() {
  return (
    <PagePlaceholder title="Новая операция" description="Здесь будет форма для ввода суммы, типа, категории и даты операции.">
      <Link to="/transactions">← Вернуться к операциям</Link>
    </PagePlaceholder>
  )
}

export function BudgetsPage() {
  return <PagePlaceholder title="Бюджеты" description="Здесь можно будет задать месячные лимиты и сравнить их с расходами по категориям." />
}

export function SettingsPage() {
  return <PagePlaceholder title="Настройки" description="Здесь появится переключение светлой и тёмной темы оформления." />
}

export function NotFoundPage() {
  return (
    <PagePlaceholder title="Страница не найдена" description="Проверьте адрес или вернитесь на главную страницу.">
      <Link to="/">Открыть обзор →</Link>
    </PagePlaceholder>
  )
}
