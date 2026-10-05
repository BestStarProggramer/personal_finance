import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Collapse, Stack, TextField } from '@mui/material'
import type { Registration } from '../../entities/auth/model/context'
import { useAsyncAction } from '../../shared/lib/use-async-action'
import { validateAuth } from './validation'
import type { AuthDraft } from './validation'

type Props = { registration: boolean; onSubmit: (data: Registration) => Promise<void> }

export default function AuthForm({ registration, onSubmit }: Props) {
  const [draft, setDraft] = useState<AuthDraft>({ name: '', email: '', password: '', confirmation: '' })
  const [submitted, setSubmitted] = useState(false)
  const { pending, error, run, clearError } = useAsyncAction()
  const errors = submitted ? validateAuth(draft, registration) : {}

  function change(field: keyof AuthDraft, value: string) { setDraft((current) => ({ ...current, [field]: value })); clearError() }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    const validation = validateAuth(draft, registration)
    const first = Object.keys(validation)[0]
    if (first) { document.getElementById(`auth-${first}`)?.focus(); return }
    void run(() => onSubmit({ name: draft.name.trim(), email: draft.email.trim(), password: draft.password }), () => {})
  }

  return (
    <Stack component="form" noValidate onSubmit={submit} spacing={2} aria-busy={pending}>
      <Collapse in={Boolean(error)} unmountOnExit><Alert severity="error">{error}</Alert></Collapse>
      <Collapse in={submitted && Object.keys(errors).length > 0} unmountOnExit><Alert severity="error">Проверьте выделенные поля.</Alert></Collapse>
      <Stack component="fieldset" disabled={pending} spacing={3} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        {registration && <TextField id="auth-name" label="Имя" required autoComplete="name" value={draft.name} onChange={(event) => change('name', event.target.value)} error={Boolean(errors.name)} helperText={errors.name} />}
        <TextField id="auth-email" label="Email" required type="email" autoComplete="username" value={draft.email} onChange={(event) => change('email', event.target.value)} error={Boolean(errors.email)} helperText={errors.email} />
        <TextField id="auth-password" label="Пароль" required type="password" autoComplete={registration ? 'new-password' : 'current-password'} value={draft.password} onChange={(event) => change('password', event.target.value)} error={Boolean(errors.password)} helperText={errors.password || (registration ? 'Не менее 8 символов.' : undefined)} />
        {registration && <TextField id="auth-confirmation" label="Повторите пароль" required type="password" autoComplete="new-password" value={draft.confirmation} onChange={(event) => change('confirmation', event.target.value)} error={Boolean(errors.confirmation)} helperText={errors.confirmation} />}
        <Button variant="contained" type="submit" loading={pending}>{registration ? 'Зарегистрироваться' : 'Войти'}</Button>
      </Stack>
    </Stack>
  )
}
