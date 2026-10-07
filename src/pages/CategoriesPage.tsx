import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useFinance } from '../entities/finance/model/use-finance'
import CategoryEditor from '../features/manage-category/CategoryEditor'
import AsyncContent from '../shared/ui/AsyncContent'
import DeleteButton from '../shared/ui/DeleteButton'
import EmptyState from '../shared/ui/EmptyState'

export default function CategoriesPage() {
  const { state, retry, deleteCategory } = useFinance()
  return <Stack spacing={3}>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Box><Typography variant="h1">Категории</Typography><Typography color="text.secondary">Свои категории доходов и расходов</Typography></Box>
      <Button disabled={state.status === 'loading'} onClick={retry}>Обновить данные</Button>
    </Stack>
    <AsyncContent state={state} onRetry={retry}>
      {({ categories }) => <>
        <CategoryEditor categories={categories} />
        {categories.length === 0 && <EmptyState title="Категорий пока нет" description="Создайте категорию, чтобы добавлять операции и бюджеты." />}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {(['expense', 'income'] as const).map((type) => <Paper key={type} component="section" variant="outlined" sx={{ p: 2, minWidth: 0 }}>
            <Typography variant="h6" component="h2" gutterBottom>{type === 'expense' ? 'Расходы' : 'Доходы'}</Typography>
            <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {categories.filter((item) => item.type === type).map((category) => <Box component="li" key={category.id} sx={{ overflowWrap: 'anywhere' }}>
                <Typography sx={{ fontWeight: 600 }}>{category.name}</Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                  <CategoryEditor categories={categories} initial={category} />
                  <DeleteButton label="Удалить категорию" title="Удалить категорию?"
                    description={`Категория «${category.name}» будет удалена. Удаление доступно, если у неё нет операций и бюджетов.`}
                    onDelete={() => deleteCategory(category.id)} />
                </Stack>
              </Box>)}
            </Stack>
            {!categories.some((item) => item.type === type) && <Typography color="text.secondary">Категорий этого типа пока нет.</Typography>}
          </Paper>)}
        </Box>
      </>}
    </AsyncContent>
  </Stack>
}
