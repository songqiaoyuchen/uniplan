"use client";

import IconButton from "@mui/material/IconButton";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "@/providers/ThemeProvider";
import Tooltip from "@mui/material/Tooltip";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip
      title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <IconButton 
        size="large"
        onClick={toggleTheme}
        sx={{
          borderRadius: { xs: 1.5, md: "50%" },
          "&:hover": { bgcolor: "action.hover" }
        }}
      >
        {mode === "light" ? <DarkModeIcon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
}
