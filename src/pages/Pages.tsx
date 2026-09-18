import { Link } from 'react-router'
import { Button } from '@mui/material'
import PagePlaceholder from '../components/PagePlaceholder'

export function NotFoundPage() {
  return (
    <PagePlaceholder title="Страница не найдена" description="Проверьте адрес или вернитесь на главную страницу.">
      <Button component={Link} to="/" variant="contained">Открыть обзор →</Button>
    </PagePlaceholder>
  )
}
