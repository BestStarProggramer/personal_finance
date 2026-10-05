export type AuthDraft = { name: string; email: string; password: string; confirmation: string }
export type AuthErrors = Partial<Record<keyof AuthDraft, string>>

export function validateAuth(draft: AuthDraft, registration: boolean): AuthErrors {
  const errors: AuthErrors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()) || draft.email.trim().length > 254) errors.email = 'Укажите корректный email.'
  if (!draft.password || draft.password.length > 128 || (registration && draft.password.length < 8)) errors.password = registration ? 'Пароль должен содержать от 8 до 128 символов.' : 'Введите пароль, до 128 символов.'
  if (registration) {
    if (!draft.name.trim() || draft.name.trim().length > 80) errors.name = 'Введите имя, до 80 символов.'
    if (draft.confirmation !== draft.password) errors.confirmation = 'Пароли не совпадают.'
  }
  return errors
}
