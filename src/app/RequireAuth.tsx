import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../entities/auth/model/use-auth'
import SessionStatus from '../shared/ui/SessionStatus'

export default function RequireAuth() {
  const { state, retry } = useAuth()
  const location = useLocation()
  if (state.status === 'checking' || state.status === 'error') return <SessionStatus error={state.status === 'error' ? state.message : undefined} onRetry={retry} />
  if (state.status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}
