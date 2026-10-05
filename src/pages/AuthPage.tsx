import { Link, Navigate, useLocation } from 'react-router'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { useAuth } from '../entities/auth/model/use-auth'
import AuthForm from '../features/authenticate/AuthForm'
import SessionStatus from '../shared/ui/SessionStatus'

export default function AuthPage({ registration = false }: { registration?: boolean }) {
  const { state, retry, login, register } = useAuth()
  const location = useLocation()
  const from: unknown = (location.state as { from?: unknown } | null)?.from
  const destination = typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') && !['/login', '/register'].includes(from) ? from : '/'
  if (state.status === 'authenticated') return <Navigate to={destination} replace />
  if (state.status === 'checking' || state.status === 'error') return <SessionStatus error={state.status === 'error' ? state.message : undefined} onRetry={retry} />
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, maxWidth: 560, mx: 'auto' }}><Stack spacing={3}>
    <Typography variant="h1">{registration ? 'Регистрация' : 'Вход'}</Typography>
    <Typography color="text.secondary">{registration ? 'Создайте аккаунт для учёта личных доходов и расходов.' : 'Войдите, чтобы открыть свои операции и бюджеты.'}</Typography>
    <AuthForm key={registration ? 'register' : 'login'} registration={registration} onSubmit={(data) => registration ? register(data) : login({ email: data.email, password: data.password })} />
    <Button component={Link} to={registration ? '/login' : '/register'} state={{ from: destination }}>{registration ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт'}</Button>
  </Stack></Paper>
}
