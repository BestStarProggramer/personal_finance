import { FormControlLabel, Switch } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

export default function ThemeToggle() {
  const { mode, setMode } = useColorScheme()
  return <FormControlLabel control={<Switch checked={mode === 'dark'} onChange={(_, checked) => setMode(checked ? 'dark' : 'light')} />} label="Тёмная тема" />
}
