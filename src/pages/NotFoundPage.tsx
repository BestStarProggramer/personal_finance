import { Link } from 'react-router'
import { Button } from '@mui/material'
import PageMessage from '../shared/ui/PageMessage'

export default function NotFoundPage() {
  return (
    <PageMessage title="Страница не найдена" description="Проверьте адрес или вернитесь на главную страницу.">
      <Button component={Link} to="/" variant="contained">Открыть обзор →</Button>
    </PageMessage>
  )
}
