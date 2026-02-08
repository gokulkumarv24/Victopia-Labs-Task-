import { createTheme, ThemeOptions } from '@mui/material/styles';

// Match your current Tailwind color palette
const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#3b82f6',  // blue-500 as main primary color
      light: '#60a5fa', // blue-400
      dark: '#2563eb',  // blue-600
      50: '#eff6ff',
      100: '#dbeafe', 
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Your current primary-500
      600: '#2563eb',  // Your current primary-600  
      700: '#1d4ed8',  // Your current primary-700
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      main: '#64748b',  // gray-500 as main secondary color
      light: '#94a3b8', // gray-400
      dark: '#475569',  // gray-600
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0', 
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    error: {
      main: '#ef4444',  // red-500
      light: '#f87171', // red-400
      dark: '#dc2626',  // red-600
    },
    warning: {
      main: '#f59e0b',  // amber-500
      light: '#fbbf24', // amber-400
      dark: '#d97706',  // amber-600
    },
    success: {
      main: '#10b981',  // emerald-500
      light: '#34d399', // emerald-400
      dark: '#059669',  // emerald-600
    },
    grey: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db', 
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont', 
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 800,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem', 
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600, 
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4, 
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem', 
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8, // Match your current border radius
  },
  spacing: 8, // 8px base spacing (matches Tailwind's default)
  components: {
    // Override default MUI styling to match your current design
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem', // rounded-md equivalent
          textTransform: 'none', // Prevent UPPERCASE text
          fontWeight: 500,
          padding: '0.5rem 1rem', // py-2 px-4 equivalent
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem', // rounded-lg equivalent
          border: '1px solid #e5e7eb', // border-gray-200
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          transition: 'box-shadow 0.15s ease-in-out',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.375rem', // rounded-md
            '&:hover fieldset': {
              borderColor: '#d1d5db', // gray-300
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '9999px', // rounded-full
          fontSize: '0.75rem', // text-xs
          fontWeight: 500,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);