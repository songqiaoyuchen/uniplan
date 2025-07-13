// src/styles/mui.d.ts
import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface PaletteColor {
    extraLight?: string;
  }

  interface SimplePaletteColorOptions {
    extraLight?: string;
  }

  interface Palette {
    custom: {
      moduleCard: {
        hoverOpacity: number;
        selectedBorderWidth: string;
        selectedGlowWidth: string;
        selectedBorderColor: string;
        backgroundColors: {
          completed: string;
          planned: string;
          locked: string;
          blocked: string;
          conflicted: string;
        };
        borderColors: {
          completed: string;
          planned: string;
          locked: string;
          blocked: string;
          conflicted: string;
        };
      };
    };
  }

  interface PaletteOptions {
    custom?: {
      moduleCard?: {
        hoverOpacity?: number;
        selectedBorderWidth?: string;
        selectedGlowWidth?: string;
        selectedBorderColor: string;
        backgroundColors?: {
          completed?: string;
          planned?: string;
          locked?: string;
          blocked?: string;
          conflicted?: string;
        };
        borderColors?: {
          completed?: string;
          planned?: string;
          locked?: string;
          blocked?: string;
          conflicted?: string;
        };
      };
    };
  }
}
