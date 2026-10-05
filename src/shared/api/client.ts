export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

type Options = RequestInit & { json?: unknown }
type TokenResult = { access_token: string }

// Access tokens live only in memory. The browser manages the HttpOnly refresh cookie.
export class ApiClient {
  private token: string | null = null
  private refreshing: Promise<void> | null = null
  private generation = 0
  private loggingOut = false
  private listeners = new Set<() => void>()

  onSessionExpired(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  setAccessToken(token: string): void { this.generation++; this.token = token }

  private clear(): void {
    this.generation++
    this.token = null
    this.listeners.forEach((listener) => listener())
  }

  async publicRequest<T>(path: string, options: Options = {}): Promise<T> {
    let response: Response
    const { json, ...init } = options
    const headers = new Headers(init.headers)
    if (json !== undefined) headers.set('Content-Type', 'application/json')
    try {
      response = await fetch(`/api${path}`, { ...init, headers, credentials: 'include', body: json === undefined ? init.body : JSON.stringify(json) })
    } catch (error) {
      if (init.signal?.aborted) throw error
      throw new ApiError(0, 'Не удалось связаться с сервером. Проверьте соединение и повторите попытку.')
    }
    if (!response.ok) {
      let message = response.status >= 500 ? 'Сервер временно недоступен. Повторите попытку.' : 'Не удалось выполнить запрос.'
      try {
        const body: { detail?: unknown } = await response.json()
        if (typeof body.detail === 'string') message = body.detail
        else if (Array.isArray(body.detail)) message = 'Проверьте правильность введённых данных.'
      } catch { /* A proxy may return a non-JSON error. */ }
      throw new ApiError(response.status, message)
    }
    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
  }

  async refresh(): Promise<void> {
    if (this.loggingOut) throw new ApiError(401, 'Выполняется выход из приложения.')
    if (this.refreshing) return this.refreshing
    const generation = this.generation
    this.refreshing = this.publicRequest<TokenResult>('/auth/refresh', { method: 'POST' }).then((result) => {
      if (generation !== this.generation) throw new ApiError(401, 'Сессия изменилась. Войдите снова.')
      this.token = result.access_token
    }).catch((error: unknown) => {
      if (generation === this.generation && error instanceof ApiError && error.status === 401) this.clear()
      throw error
    }).finally(() => { this.refreshing = null })
    return this.refreshing
  }

  async request<T>(path: string, options: Options = {}): Promise<T> {
    if (!this.token) await this.refresh()
    const send = () => {
      const headers = new Headers(options.headers)
      headers.set('Authorization', `Bearer ${this.token}`)
      return this.publicRequest<T>(path, { ...options, headers })
    }
    const sentToken = this.token
    try { return await send() } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || options.signal?.aborted) throw error
      // Parallel 401 responses share one rotation; a late response uses the new token.
      if (this.token === sentToken) await this.refresh()
      try { return await send() } catch (retryError) {
        if (retryError instanceof ApiError && retryError.status === 401) this.clear()
        throw retryError
      }
    }
  }

  async logout(): Promise<void> {
    if (this.refreshing) { try { await this.refreshing } catch { /* Logout still removes the cookie. */ } }
    this.loggingOut = true
    try {
      await this.publicRequest('/auth/logout', { method: 'POST', headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined })
      this.clear()
    } finally { this.loggingOut = false }
  }
}

export const apiClient = new ApiClient()
