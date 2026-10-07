import { useState } from 'react'
import { Box, Button, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from '@mui/material'
import { isValidMonth, localDate } from '../lib/date'

type Props = {
  id: string
  value: string
  onChange: (month: string) => void
  required?: boolean
  clearable?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
}
const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(2020, index, 1)))

export default function MonthPicker({ id, value, onChange, required, clearable = required, disabled, error, helperText }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [year, setYear] = useState(new Date().getFullYear())
  const selected = isValidMonth(value) ? new Date(`${value}-01T12:00:00`) : null

  function open(element: HTMLElement) {
    setYear(selected?.getFullYear() ?? new Date().getFullYear())
    setAnchor(element.closest('.MuiTextField-root') as HTMLElement)
  }
  function select(month: string) {
    onChange(month)
    setAnchor(null)
  }

  return <>
    <TextField id={id} label="Месяц" value={selected ? `${months[selected.getMonth()]} ${selected.getFullYear()}` : ''}
      required={required} disabled={disabled} error={error} helperText={helperText}
      onClick={(event) => { if (!disabled) open(event.currentTarget) }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown')) {
          event.preventDefault()
          open(event.currentTarget)
        }
      }}
      slotProps={{ input: { readOnly: true, endAdornment: <InputAdornment position="end">
        <IconButton disabled={disabled} aria-label="Открыть календарь" aria-haspopup="dialog" aria-expanded={Boolean(anchor)}>▦</IconButton>
      </InputAdornment> } }} />
    <Popover open={Boolean(anchor) && !disabled} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
      <Box role="dialog" aria-label="Выбор месяца" sx={{ p: 2, width: 300, maxWidth: 'calc(100vw - 32px)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton aria-label="Предыдущий год" disabled={year <= 1} onClick={() => setYear(year - 1)}>‹</IconButton>
          <Typography aria-live="polite">{year}</Typography>
          <IconButton aria-label="Следующий год" disabled={year >= 9999} onClick={() => setYear(year + 1)}>›</IconButton>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
          {months.map((month, index) => {
            const isoMonth = `${String(year).padStart(4, '0')}-${String(index + 1).padStart(2, '0')}`
            return <Button key={month} aria-label={`${month} ${year}`} aria-pressed={isoMonth === value}
              variant={isoMonth === value ? 'contained' : 'text'} sx={{ minWidth: 0 }} onClick={() => select(isoMonth)}>{month}</Button>
          })}
        </Box>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => select(localDate().slice(0, 7))}>Текущий месяц</Button>
        {clearable && <Button fullWidth onClick={() => select('')}>Очистить</Button>}
      </Box>
    </Popover>
  </>
}

