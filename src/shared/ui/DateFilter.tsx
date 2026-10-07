import { useState } from 'react'
import { Box, Button, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from '@mui/material'
import { formatDate, isValidDate, localDate, parseDate } from '../lib/date'

type Props = {
  value: string
  onChange: (date: string) => void
  id?: string
  label?: string
  error?: boolean
  helperText?: string
  required?: boolean
  disabled?: boolean
}
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'full' })

export default function DateFilter({ value, onChange, id = 'filter-date', label = 'Дата', error, helperText, required, disabled }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [month, setMonth] = useState(() => new Date())
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const today = localDate()
  const [touched, setTouched] = useState(false)
  const invalid = Boolean(value && !isValidDate(value) && (touched || value.length >= 10))

  function select(date: string) {
    onChange(date)
    setAnchor(null)
  }

  return <>
    <TextField id={id} label={label} value={isValidDate(value) ? formatDate(value) : value}
      required={required} disabled={disabled} placeholder="ДД.ММ.ГГГГ" error={error || invalid}
      helperText={invalid ? 'Введите корректную дату в формате ДД.ММ.ГГГГ.' : helperText}
      onBlur={() => setTouched(true)}
      onChange={(event) => onChange(parseDate(event.target.value) ?? event.target.value)}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { maxLength: 10 },
        input: { endAdornment: <InputAdornment position="end">
          <IconButton disabled={disabled} aria-label={label === 'Дата' ? 'Открыть календарь' : `Открыть календарь: ${label}`} aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
            onClick={(event) => {
              setMonth(new Date(`${isValidDate(value) ? value : today}T12:00:00`))
              setAnchor(event.currentTarget.closest('.MuiTextField-root') as HTMLElement)
            }}>▦</IconButton>
        </InputAdornment> },
      }} />
    <Popover open={Boolean(anchor) && !disabled} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
      <Box role="dialog" aria-label="Выбор даты" sx={{ p: 2, width: 300, maxWidth: 'calc(100vw - 32px)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton disabled={disabled} aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</IconButton>
          <Typography aria-live="polite" sx={{ textTransform: 'capitalize' }}>{monthFormatter.format(firstDay)}</Typography>
          <IconButton disabled={disabled} aria-label="Следующий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</IconButton>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
          {weekdays.map((day) => <Typography key={day} variant="caption" align="center" color="text.secondary">{day}</Typography>)}
          {Array.from({ length: offset }, (_, index) => <Box key={`empty-${index}`} />)}
          {Array.from({ length: dayCount }, (_, index) => {
            const date = new Date(month.getFullYear(), month.getMonth(), index + 1)
            const isoDate = localDate(date)
            return <Button key={isoDate} aria-label={dayFormatter.format(date)} aria-pressed={isoDate === value}
              variant={isoDate === value ? 'contained' : 'text'}
              sx={{ minWidth: 0, p: 0, height: 36, border: isoDate === today ? '1px solid' : undefined, borderColor: 'primary.main' }}
              onClick={() => select(isoDate)}>{index + 1}</Button>
          })}
        </Box>
        <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1 }}>
          <Button onClick={() => select('')}>Очистить</Button>
          <Button onClick={() => select(today)}>Сегодня</Button>
        </Stack>
      </Box>
    </Popover>
  </>
}
