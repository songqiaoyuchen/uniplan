import { createTheme, ThemeOptions } from "@mui/material/styles";

// ================= COMMON OPTIONS =================
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
        variant: "outlined",
      },
    },
  },
};

// ================= LIGHT THEME =================
export const lightTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "light",
    primary: { main: "#6741c3" },
    secondary: { main: "#ff80c8" },
    info: { main: "#40ace6" },
    success: { main: "#40ed48" },
    warning: { main: "#ef8937" },
    error: { main: "#f7523f" },
    background: { default: "#ffffff", paper: "#ececec" },
    text: { primary: "#000000", secondary: "#333333" },
    custom: {
      moduleCard: {
        selectedBorderWidth: "2px",
        selectedGlowWidth: "1px",
        selectedBorderColor: "#6856ce",
        backgroundColors: {
          completed: "#b3f4bd",
          unlocked: "#c1aff3",
          locked: "#fcadad",
          blocked: "#f8ed96",
          conflicted: "#f8ca96",
        },
        borderColors: {
          completed: "#4fe058",
          unlocked: "#764fd1",
          locked: "#f04040",
          blocked: "#f1cc29",
          conflicted: "#f18329",
        },
      },
    },
  },
  components: {
    ...commonOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          "*::-webkit-scrollbar": { width: "8px", height: "8px" },
          "*::-webkit-scrollbar-track": { background: "#f5f5f5" },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: "#bbbbbb",
            borderRadius: "4px",
          },
          "*::-webkit-scrollbar-thumb:hover": { backgroundColor: "#999999" },
          "*": { scrollbarColor: "#bbbbbb #f5f5f5", scrollbarWidth: "normal" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: "#000000" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: { color: "#000000" },
        notchedOutline: { borderColor: "#ffffff" },
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#bea6f7",
          }, // primary.extraLight
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6741c3",
          }, // primary.main
        },
      },
    },
  },
});

// ================= DARK THEME =================
export const darkTheme = createTheme({
  ...commonOptions,
  palette: {
    mode: "dark",
    primary: { main: "#6741c3", extraLight: "#bea6f7" },
    secondary: { main: "#ff80c8" },
    info: { main: "#40ace6" },
    success: { main: "#40ed48" },
    warning: { main: "#ef8937" },
    error: { main: "#f7523f" },
    background: { default: "#1f1f1f", paper: "#2b2b2b" },
    text: { primary: "#ececec", secondary: "#acacac" },
    custom: {
      moduleCard: {
        selectedBorderWidth: "2px",
        selectedGlowWidth: "1px",
        selectedBorderColor: "#ff80c8",
        backgroundColors: {
          completed: "#265e33",
          unlocked: "#3d2d66",
          locked: "#611d1d",
          blocked: "#554616",
          conflicted: "#553616",
        },
        borderColors: {
          completed: "#4fe058",
          unlocked: "#764fd1",
          locked: "#f04040",
          blocked: "#f1cc29",
          conflicted: "#f18329",
        },
      },
    },
  },
  components: {
    ...commonOptions.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          "*::-webkit-scrollbar": { width: "8px", height: "8px" },
          "*::-webkit-scrollbar-track": { background: "#2d2d2d" },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: "#555555",
            borderRadius: "4px",
          },
          "*::-webkit-scrollbar-thumb:hover": { backgroundColor: "#888888" },
          "*": { scrollbarColor: "#555555 #2d2d2d", scrollbarWidth: "thin" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: "#ededed" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        input: { color: "#ececec" },
        notchedOutline: { borderColor: "#2b2b2b" },
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#bea6f7",
          }, // primary.extraLight
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6741c3",
          }, // primary.main
        },
      },
    },
  },
});
