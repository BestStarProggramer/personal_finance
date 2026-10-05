import { Alert, Paper, Stack, Typography } from '@mui/material'
import ThemeToggle from '../features/toggle-theme/ThemeToggle'

export default function SettingsPage() {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack spacing={3}>
        <Typography variant="h1">Настройки</Typography>
        <Typography color="text.secondary">Оформление приложения</Typography>
        <ThemeToggle />
        <Typography>Валюта учёта: российский рубль (₽).</Typography>
        <Alert severity="info">Тема сохраняется в этом браузере. Операции и бюджеты хранятся в вашем аккаунте на сервере и доступны после повторного входа.</Alert>
      </Stack>
    </Paper>
  )
}
