import { useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material'
import { useAuth } from '../entities/auth/model/use-auth'
import LogoutButton from '../features/logout/LogoutButton'

const navigation = [
  { to: '/', label: 'Обзор' },
  { to: '/transactions', label: 'Операции' },
  { to: '/budgets', label: 'Бюджеты' },
  { to: '/categories', label: 'Категории' },
  { to: '/settings', label: 'Настройки' },
]

export default function AppLayout() {
  const { state: auth, logout } = useAuth()
  const links = auth.status === 'authenticated' ? navigation : [{ to: '/login', label: 'Вход' }, { to: '/register', label: 'Регистрация' }, { to: '/settings', label: 'Настройки' }]
  const { pathname } = useLocation()
  const main = useRef<HTMLElement | null>(null)
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current !== pathname) {
      main.current?.focus({ preventScroll: true })
      window.scrollTo({ top: 0 })
      previousPath.current = pathname
    }
  }, [pathname])
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
            {links.map(({ to, label }) => (
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
          {auth.status === 'authenticated' && <Stack spacing={1} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <Typography variant="body2">{auth.user.name}</Typography>
            <LogoutButton onLogout={logout} />
          </Stack>}
        </Stack>
      </Paper>
      <Box component="main" id="main-content" tabIndex={-1} ref={main} sx={{ outline: 'none' }}>
        <Box key={pathname} className="route-transition"><Outlet /></Box>
      </Box>
    </Container>
  )
}
