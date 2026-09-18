import { Link } from 'react-router'
import { Button } from '@mui/material'
import PagePlaceholder from '../components/PagePlaceholder'

export function OverviewPage() {
  return (
    <PagePlaceholder title="Обзор" description="Здесь появятся доходы, расходы и итоги за выбранный месяц.">
      <Button component={Link} to="/transactions" variant="contained">Перейти к операциям →</Button>
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
      <Button component={Link} to="/" variant="contained">Открыть обзор →</Button>
    </PagePlaceholder>
  )
}
