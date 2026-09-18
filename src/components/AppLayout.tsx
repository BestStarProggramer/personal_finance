import { NavLink, Outlet } from 'react-router'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'

const navigation = [
  { to: '/', label: 'Обзор' },
  { to: '/transactions', label: 'Операции' },
  { to: '/budgets', label: 'Бюджеты' },
  { to: '/settings', label: 'Настройки' },
]

export default function AppLayout() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <a className="skip-link" href="#main-content">Перейти к содержимому</a>
      <Paper component="header" variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography component="p" variant="h6" sx={{ fontWeight: 700 }}>Личный бюджет</Typography>
            <Typography variant="body2" color="text.secondary">Доходы, расходы и планы</Typography>
          </Box>
          <Box component="nav" aria-label="Основная навигация" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {navigation.map(({ to, label }) => (
              <Button
                key={to}
                component={NavLink}
                to={to}
                end={to === '/'}
                sx={{
                  color: 'text.secondary',
                  px: 2,
                  '&.active': { bgcolor: 'primary.main', color: 'primary.contrastText' },
                  '&.active:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>
        </Stack>
      </Paper>
      <Box component="main" id="main-content" tabIndex={-1}>
        <Outlet />
      </Box>
    </Container>
  )
}
