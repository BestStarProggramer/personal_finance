import { Box, MenuItem, TextField } from '@mui/material'
import { categories } from '../../entities/finance/model/types'
import type { TransactionFilters as Filters, TransactionType } from '../../entities/finance/model/types'

type Props = { value: Filters; onChange: (filters: Filters) => void }

export default function TransactionFilters({ value, onChange }: Props) {
  const availableCategories = value.type ? categories[value.type] : [...categories.income, ...categories.expense]
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
      <TextField id="filter-month" label="Месяц" type="month" value={value.month} slotProps={{ inputLabel: { shrink: true } }}
        onChange={(event) => onChange({ ...value, month: event.target.value })} />
      <TextField id="filter-type" select label="Тип операции" value={value.type}
        onChange={(event) => onChange({ ...value, type: event.target.value as TransactionType | '', category: '' })}>
        <MenuItem value="">Все типы</MenuItem><MenuItem value="income">Доход</MenuItem><MenuItem value="expense">Расход</MenuItem>
      </TextField>
      <TextField id="filter-category" select label="Категория" value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })}>
        <MenuItem value="">Все категории</MenuItem>
        {availableCategories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
      </TextField>
    </Box>
  )
}
