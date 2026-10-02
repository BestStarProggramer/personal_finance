import { useEffect, useRef, useState } from 'react'

export function useAsyncAction() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  async function run(action: () => Promise<void>, onSuccess: () => void): Promise<void> {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    try {
      await action()
      if (mounted.current) onSuccess()
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Не удалось сохранить данные. Повторите попытку.')
    } finally {
      busy.current = false
      if (mounted.current) setPending(false)
    }
  }

  return { pending, error, run, clearError: () => setError('') }
}
