import { useState } from 'react'
import { Box, Button, IconButton, InputAdornment, Popover, Stack, TextField, Typography } from '@mui/material'
import { localDate } from '../lib/date'

type Props = { value: string; onChange: (date: string) => void }
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const dayFormatter = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'full' })

export default function DateFilter({ value, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [month, setMonth] = useState(() => new Date())
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const offset = (firstDay.getDay() + 6) % 7
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const today = localDate()

  function select(date: string) {
    onChange(date)
    setAnchor(null)
  }

  return <>
    <TextField id="filter-date" label="Дата" type="date" value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ '& input::-webkit-calendar-picker-indicator': { display: 'none' } }}
      slotProps={{
        inputLabel: { shrink: true },
        input: { endAdornment: <InputAdornment position="end">
          <IconButton aria-label="Открыть календарь" aria-haspopup="dialog" aria-expanded={Boolean(anchor)}
            onClick={(event) => {
              setMonth(new Date(`${value || today}T12:00:00`))
              setAnchor(event.currentTarget.closest('.MuiTextField-root') as HTMLElement)
            }}>▦</IconButton>
        </InputAdornment> },
      }} />
    <Popover open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
      <Box role="dialog" aria-label="Выбор даты" sx={{ p: 2, width: 300, maxWidth: 'calc(100vw - 32px)' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <IconButton aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</IconButton>
          <Typography aria-live="polite" sx={{ textTransform: 'capitalize' }}>{monthFormatter.format(firstDay)}</Typography>
          <IconButton aria-label="Следующий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</IconButton>
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
