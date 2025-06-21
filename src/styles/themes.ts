import { createTheme, ThemeOptions } from "@mui/material/styles";

const commonOptions: Partial<ThemeOptions> = {
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: { fontSize: "2.5rem", fontWeight: 700 },
    h2: { fontSize: "2rem", fontWeight: 600 },
    h3: { fontSize: "1.75rem", fontWeight: 500 },
    h4: { fontSize: "1.5rem", fontWeight: 500 },
    h5: { fontSize: "1.25rem", fontWeight: 400 },
    h6: { fontSize: "1rem", fontWeight: 400 },
    body1: { fontSize: "1rem", fontWeight: 400 },
    body2: { fontSize: "0.875rem", fontWeight: 400 },
    button: { fontSize: "0.875rem", fontWeight: 500 },
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
};

export const lightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'light',
    primary: { main: '#6741c3' },
    secondary: { main: '#ff80c8' },
    info: { main: '#40ace6' },
    success: { main: '#60c565' },
    warning: { main: '#fd8421' },
    error: { main: '#ec3636' },
    background: { default: '#ffffff', paper: '#f5f5f5' },
    text: { primary: '#000000', secondary: '#333333' },
    action: { hover: '#d3d3d3'},
  },
  components: {
    ...commonOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background: '#f5f5f5',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#bbbbbb',
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#999999',
          },
          '*': {
            scrollbarColor: '#bbbbbb #f5f5f5', // For Firefox
            scrollbarWidth: 'normal',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: '#000000' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: { color: '#000000' },
        notchedOutline: { borderColor: '#ffffff' },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
        },
      },
    },
  },
});


export const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: 'dark',
    primary: { 
      main: '#6741c3',
      extraLight: '#bea6f7',
    },
    secondary: { main: '#ff80c8' },
    info: { main: '#40ace6' },
    success: { main: '#34a03a' },
    warning: { main: '#da6200' },
    error: { main: '#db2020' },
    background: { default: '#1f1f1f', paper: '#272727' },
    text: { primary: '#e0e0e0', secondary: '#acacac' },
    action: { hover: 'rgb(63, 63, 63)'},
  },
  components: {
    ...commonOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background: '#2d2d2d',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#555555',
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#888888',
          },
          '*': {
            scrollbarColor: '#555555 #2d2d2d', // For Firefox
            scrollbarWidth: 'normal',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: '#ededed' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: { color: '#ededed' },
        notchedOutline: { borderColor: '#333333' },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#90caf9' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2' },
        },
      },
    },
  },
});

