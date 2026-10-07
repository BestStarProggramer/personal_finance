import { useState } from 'react'
import { Box, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { Category, TransactionFilters as Filters, TransactionType } from '../../entities/finance/model/types'
import DateFilter from '../../shared/ui/DateFilter'
import MonthPicker from '../../shared/ui/MonthPicker'
import { isValidDate } from '../../shared/lib/date'

type Props = { categories: Category[]; value: Filters; onChange: (filters: Filters) => void }
type DateMode = 'date' | 'month' | 'range'

export default function TransactionFilters({ categories, value, onChange }: Props) {
  const [mode, setMode] = useState<DateMode>('date')
  const availableCategories = categories.filter((item) => !value.type || item.type === value.type)
  const reversedRange = Boolean(value.dateFrom && value.dateTo && isValidDate(value.dateFrom) && isValidDate(value.dateTo) && value.dateFrom > value.dateTo)
  return (
    <Stack spacing={2}>
      <ToggleButtonGroup exclusive value={mode} aria-label="Фильтр по времени" size="small"
        onChange={(_, next: DateMode | null) => {
          if (!next) return
          setMode(next)
          onChange({ ...value, date: '', month: '', dateFrom: '', dateTo: '' })
        }} sx={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}>
        <ToggleButton value="date">За день</ToggleButton>
        <ToggleButton value="month">За месяц</ToggleButton>
        <ToggleButton value="range">За период</ToggleButton>
      </ToggleButtonGroup>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: `repeat(${mode === 'range' ? 4 : 3}, minmax(0, 1fr))` }, gap: 2 }}>
        {mode === 'date' && <DateFilter value={value.date ?? ''} onChange={(date) => onChange({ ...value, date })} />}
        {mode === 'month' && <MonthPicker id="filter-month" clearable value={value.month} onChange={(month) => onChange({ ...value, month })} />}
        {mode === 'range' && <>
          <DateFilter id="filter-date-from" label="Дата с" value={value.dateFrom ?? ''}
            onChange={(dateFrom) => onChange({ ...value, dateFrom })} />
          <DateFilter id="filter-date-to" label="Дата по" value={value.dateTo ?? ''}
            onChange={(dateTo) => onChange({ ...value, dateTo })} error={reversedRange}
            helperText={reversedRange ? 'Конец периода не может быть раньше начала.' : 'Начальная и конечная даты включены.'} />
        </>}
        <TextField id="filter-type" select label="Тип операции" value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value as TransactionType | '', category: '' })}>
          <MenuItem value="">Все типы</MenuItem><MenuItem value="income">Доход</MenuItem><MenuItem value="expense">Расход</MenuItem>
        </TextField>
        <TextField id="filter-category" select label="Категория" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
          <MenuItem value="">Все категории</MenuItem>
          {availableCategories.map((category) => <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>)}
        </TextField>
      </Box>
    </Stack>
  )
}
