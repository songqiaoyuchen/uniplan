import { ModuleStatus } from "@/types/plannerTypes";
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
    error: { main: "#ff240b" },
    background: { default: "#ffffff", paper: "#ececec" },
    text: { primary: "#000000", secondary: "#333333" },
    custom: {
  moduleCard: {
    selectedBorderWidth: "2px",
    selectedGlowWidth: "5px",           
    selectedBorderColor: "#8048dad2",  
    relatedBorderColor: "#40c3d4cc",   

    backgroundColors: {
      [ModuleStatus.Completed]:   "#DCEFE5", 
      [ModuleStatus.Unsatisfied]: "#F1E8CA", 
      [ModuleStatus.Conflicted]:  "#F3D8D8", 
    },
    borderColors: {
      [ModuleStatus.Completed]:   "#44a8762c", 
      [ModuleStatus.Satisfied]:   "#6656a831", 
      [ModuleStatus.Unsatisfied]: "#a88b3a4123", 
      [ModuleStatus.Conflicted]:  "#c25a5a4b", 
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
    error: { main: "#c92b19" },
    background: { default: "#1f1f1f", paper: "#2b2b2b" },
    text: { primary: "#ececec", secondary: "#acacac" },
    custom: {
      moduleCard: {
        selectedBorderWidth: "2px",         
        selectedGlowWidth: "5px",           
        selectedBorderColor: "#47fcb0cc",   
        relatedBorderColor: "#45c2d3ff",
        backgroundColors: {
          [ModuleStatus.Completed]:   "#1A3023",  
          [ModuleStatus.Satisfied]:   "#292341ff",
          [ModuleStatus.Unsatisfied]: "#2B2411",  
          [ModuleStatus.Conflicted]:  "#2E1212",  
        },

        borderColors: {
          [ModuleStatus.Completed]:   "#45C962CC",  
          [ModuleStatus.Satisfied]:   "#4f438bcc",  
          [ModuleStatus.Unsatisfied]: "#756229ff",  
          [ModuleStatus.Conflicted]:  "#E15A5ACC",
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
