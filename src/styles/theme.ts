import { createTheme, ThemeOptions } from "@mui/material/styles";

const themeOptions: ThemeOptions = {
  palette: {
    mode: "light", // Set to "dark" for dark mode
    primary: {
      main: "#1976d2", // Blue
      contrastText: "#ffffff", // White
    },
    secondary: {
      main: "#9c27b0", // Purple
      contrastText: "#ffffff", // White
    },
    error: {
      main: "#d32f2f", // Red
    },
    warning: {
      main: "#ffa726", // Orange
    },
    info: {
      main: "#0288d1", // Light Blue
    },
    success: {
      main: "#2e7d32", // Green
    },
    background: {
      default: "#f5f5f5", // Light gray
      paper: "#ffffff", // White
    },
    text: {
      primary: "#212121", // Dark gray
      secondary: "#757575", // Medium gray
    },
  },
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
  spacing: 8, // Default spacing unit (can be used with theme.spacing)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px", // Rounded corners for buttons
          textTransform: "none", // Disable uppercase text
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px", // Rounded corners for Paper components
          padding: "16px", // Default padding
        },
      },
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;
