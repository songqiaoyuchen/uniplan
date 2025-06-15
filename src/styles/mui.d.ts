// src/styles/mui.d.ts
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface PaletteColor {
    extraLight?: string; 
  }

  interface SimplePaletteColorOptions {
    extraLight?: string;
  }
}
