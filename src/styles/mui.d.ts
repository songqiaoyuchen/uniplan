// src/styles/mui.d.ts
import "@mui/material/styles";
import { ModuleStatus } from "@/types/plannerTypes"; // If enum exists

declare module "@mui/material/styles" {
  interface PaletteColor {
    extraLight?: string;
  }

  interface SimplePaletteColorOptions {
    extraLight?: string;
  }

  type ModuleStatusColorMap = {
    [K in ModuleStatus]: string;
  };

  interface Palette {
    custom: {
      moduleCard: {
        hoverOpacity: number;
        selectedBorderWidth: string;
        selectedGlowWidth: string;
        selectedBorderColor: string;
        backgroundColors: ModuleStatusColorMap;
        borderColors: ModuleStatusColorMap;
      };
    };
  }

  interface PaletteOptions {
    custom?: {
      moduleCard?: {
        hoverOpacity?: number;
        selectedBorderWidth?: string;
        selectedGlowWidth?: string;
        selectedBorderColor?: string;
        backgroundColors?: Partial<ModuleStatusColorMap>;
        borderColors?: Partial<ModuleStatusColorMap>;
      };
    };
  }
}
