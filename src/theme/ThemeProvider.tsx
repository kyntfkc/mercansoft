'use client';

import { createTheme, ThemeProvider as MuiThemeProvider, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useEffect } from 'react';

// MUI tema tipini genişlet
declare module '@mui/material/styles' {
  interface PaletteColor {
    lighter?: string;
  }
  
  interface SimplePaletteColorOptions {
    lighter?: string;
  }
}

// Daha canlı ve modern bir renk paleti
const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#225C73', // Koyu petrol mavisi
      light: '#5E8A9A',
      dark: '#133745',
      contrastText: '#ffffff',
      lighter: '#E1EBF0', // Çok açık mavi
    },
    secondary: {
      main: '#2ECC71', // Modern yeşil
      light: '#54D98C',
      dark: '#25A25A',
      contrastText: '#ffffff', // Beyaz yazı
    },
    success: {
      main: '#10B981', // Canlı yeşil
      light: '#34D399',
      dark: '#059669',
      lighter: '#ECFDF5', // Çok açık yeşil
    },
    error: {
      main: '#E74C3C', // Modern kırmızı
      light: '#F1948A',
      dark: '#C0392B',
    },
    warning: {
      main: '#C2BDB2', // Açık bej/gri
      light: '#D9D5CC',
      dark: '#A5A095',
    },
    info: {
      main: '#99B1BF', // Açık mavi/gri
      light: '#B7C8D2',
      dark: '#768E9A',
    },
    background: {
      default: '#F4F6F8', // Çok açık mavi/gri
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
      disabled: '#9CA3AF',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Poppins", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.25px',
    },
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.25px',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: 0,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.15px',
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    subtitle2: {
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      letterSpacing: '0.1px',
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      letterSpacing: '0.1px',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.3px',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      letterSpacing: '0.4px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(31, 41, 55, 0.06), 0px 4px 6px rgba(31, 41, 55, 0.1)',
    '0px 5px 15px rgba(31, 41, 55, 0.07), 0px 10px 24px rgba(31, 41, 55, 0.12)',
    '0px 10px 20px rgba(31, 41, 55, 0.08), 0px 20px 30px rgba(31, 41, 55, 0.14)',
    ...Array(21).fill('none'), // Material UI 25 gölge bekliyor
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Genel stil geçersiz kılmalar
        body: {
          transition: 'all 0.2s ease-in-out',
          overflowX: 'hidden',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': {
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #225C73 0%, #5E8A9A 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(45deg, #2ECC71 0%, #54D98C 100%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #25A25A 0%, #2ECC71 100%)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12px',
          '&:last-child': {
            paddingBottom: '12px',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '8px 12px',
          fontSize: '0.9rem',
        },
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'all 0.2s ease-in-out',
          fontSize: '0.9rem',
        },
        input: {
          padding: '8px 12px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6366F1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease-in-out',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        filled: {
          '&.MuiChip-colorPrimary': {
            background: 'linear-gradient(45deg, #225C73 0%, #5E8A9A 100%)',
          },
          '&.MuiChip-colorSecondary': {
            background: 'linear-gradient(45deg, #2ECC71 0%, #54D98C 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          marginBottom: '6px',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h6: {
          fontSize: '1rem',
          marginBottom: '8px',
        },
        body1: {
          fontSize: '0.9rem',
        },
        body2: {
          fontSize: '0.8rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        outlined: {
          borderColor: 'rgba(0, 0, 0, 0.09)',
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = responsiveFontSizes(baseTheme);
  
  // Pembe butonları pastel yeşile dönüştürmek için CSS ekleyelim
  useEffect(() => {
    // Global stil ekle
    const style = document.createElement('style');
    style.innerHTML = `
      .MuiButton-containedPrimary {
        background: linear-gradient(45deg, #225C73 0%, #5E8A9A 100%) !important;
      }
      
      .MuiButton-containedSecondary {
        background: linear-gradient(45deg, #2ECC71 0%, #54D98C 100%) !important;
        color: white !important;
      }
      
      button[style*="rgb(236, 72, 153)"],
      button[style*="rgb(244, 114, 182)"] {
        background: linear-gradient(45deg, #2ECC71 0%, #54D98C 100%) !important;
        color: white !important;
      }
      
      [style*="linear-gradient(45deg, rgb(236, 72, 153) 0%, rgb(244, 114, 182) 100%)"] {
        background: linear-gradient(45deg, #2ECC71 0%, #54D98C 100%) !important;
        color: white !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
} 