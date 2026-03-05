import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

declare module '@mui/material/styles' {
  interface Palette {
    rosaNeon: Palette['primary'];
    celesteAqua: Palette['primary'];
  }
  interface PaletteOptions {
    rosaNeon?: PaletteOptions['primary'];
    celesteAqua?: PaletteOptions['primary'];
  }
}

export const createAppTheme = (t: (key: string) => string) => createTheme({
  palette: {
    primary: {
      main: '#FF3399', // Rosa Neón
      contrastText: '#fff',
    },
    secondary: {
      main: '#66D9EF', // Celeste Aqua
      contrastText: '#1f2937',
    },
    background: {
      default: '#FFFFFF', // Blanco Nube
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
    },
    rosaNeon: {
      main: '#FF3399',
    },
    celesteAqua: {
      main: '#66D9EF',
    },
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#d1d5db',
            },
            '&:hover fieldset': {
              borderColor: '#9ca3af',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#66D9EF', // Celeste Aqua
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDataGrid: {
      defaultProps: {
        localeText: {
          noRowsLabel: t('common.noRows'),
          noResultsOverlayLabel: t('common.noResults'),
        },
      },
    },
  },
});
