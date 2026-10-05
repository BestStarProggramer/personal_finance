import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError, apiClient } from '../../shared/api/client'
import { AuthContext } from '../../entities/auth/model/context'
import type { AuthState, Credentials, Registration, User } from '../../entities/auth/model/context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'checking' })

  const restore = useCallback(async (signal: AbortSignal) => {
    try {
      await apiClient.refresh()
      const user = await apiClient.request<User>('/auth/me', { signal })
      if (!signal.aborted) setState({ status: 'authenticated', user })
    } catch (error) {
      if (signal.aborted) return
      if (error instanceof ApiError && error.status === 401) setState({ status: 'anonymous' })
      else setState({ status: 'error', message: error instanceof Error ? error.message : 'Не удалось проверить сессию.' })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const unsubscribe = apiClient.onSessionExpired(() => setState({ status: 'anonymous' }))
    // oxlint-disable-next-line react/set-state-in-effect -- State is set after the asynchronous HTTP result.
    void restore(controller.signal)
    return () => { controller.abort(); unsubscribe() }
  }, [restore])

  async function authenticate(path: string, json: Credentials | Registration) {
    const result = await apiClient.publicRequest<{ access_token: string; user: User }>(path, { method: 'POST', json })
    apiClient.setAccessToken(result.access_token)
    setState({ status: 'authenticated', user: result.user })
  }

  return <AuthContext value={{
    state,
    retry: () => { setState({ status: 'checking' }); void restore(new AbortController().signal) },
    login: (credentials) => authenticate('/auth/login', credentials),
    register: (registration) => authenticate('/auth/register', registration),
    logout: () => apiClient.logout(),
  }}>{children}</AuthContext>
}
