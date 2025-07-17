"use client";

// Presentational Layer

import { ModuleData, ModuleStatus } from "@/types/plannerTypes";
import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { memo } from "react";
import { useModuleCardColors } from "../../hooks";

interface ModuleCardProps {
  module: Pick<ModuleData, "id" | "code" | "title" | "status" | "credits" | "grade">;
  isSelected?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isSelected = false }) => {
  const theme = useTheme();
  const status = module.status ?? ModuleStatus.Satisfied;
  const {
    backgroundColor,
    borderColor,
    selectedBorderWidth,
    selectedGlowWidth,
    selectedBorderColor,
  } = useModuleCardColors(status);

  return (
    <Card
      sx={{
        width: "216px",
        height: "110px",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor,
        border: isSelected
          ? `${selectedBorderWidth} solid ${selectedBorderColor}`
          : `2px solid ${borderColor}`,
        boxShadow: isSelected
          ? `0 0 0 ${selectedGlowWidth} ${selectedBorderColor}80`
          : undefined,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 6,
        },
        color: theme.palette.text.primary,
      }}
    >
      <CardContent sx={{ gap: 0}}>
        <Typography variant="subtitle2" fontWeight="bold" display="inline">
          {module.code}
        </Typography>
        <Typography variant="body2" display="inline" sx={{ ml: 1 }}>
          {module.title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default memo(ModuleCard);
