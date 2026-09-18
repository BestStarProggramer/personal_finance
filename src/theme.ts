import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#22634e' },
    background: { default: '#f3f6f3', paper: '#ffffff' },
    text: { primary: '#21352b', secondary: '#53635b' },
    divider: '#dce5df',
  },
  typography: {
    fontFamily: "system-ui, 'Segoe UI', sans-serif",
    h1: { fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          '&.Mui-focusVisible': { outline: '3px solid currentColor', outlineOffset: 3 },
        },
      },
    },
  },
})

export default theme
