import { Alert, FormControlLabel, Paper, Stack, Switch, Typography } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

export default function SettingsPage() {
  const { mode, setMode } = useColorScheme()
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack spacing={3}>
        <Typography variant="h1">Настройки</Typography>
        <Typography color="text.secondary">Оформление приложения</Typography>
        <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={(_, checked) => setMode(checked ? 'dark' : 'light')} />} label="Тёмная тема" />
        <Typography>Валюта учёта: российский рубль (₽).</Typography>
        <Alert severity="info">Тема сохраняется в этом браузере. Операции и бюджеты используют демонстрационные данные и сбрасываются после обновления страницы.</Alert>
      </Stack>
    </Paper>
  )
}
