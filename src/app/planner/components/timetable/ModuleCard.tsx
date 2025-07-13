"use client";

// Presentational Layer

import { ModuleData, ModuleStatus } from "@/types/plannerTypes";
import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { memo } from "react";

interface ModuleCardProps {
  module: Pick<ModuleData, "id" | "code" | "title" | "status">;
  isSelected?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isSelected = false }) => {
  const theme = useTheme();

  const {
    selectedBorderWidth,
    selectedGlowWidth,
    backgroundColors,
    borderColors,
  } = theme.palette.custom.moduleCard;

  const backgroundColorMap: Record<ModuleStatus, string> = {
    [ModuleStatus.Completed]: backgroundColors.completed,
    [ModuleStatus.Planned]: backgroundColors.planned,
    [ModuleStatus.Locked]: backgroundColors.locked,
    [ModuleStatus.Blocked]: backgroundColors.blocked,
    [ModuleStatus.Conflicted]: backgroundColors.conflicted,
  };

  const borderColorMap: Record<ModuleStatus, string> = {
    [ModuleStatus.Completed]: borderColors.completed,
    [ModuleStatus.Planned]: borderColors.planned,
    [ModuleStatus.Locked]: borderColors.locked,
    [ModuleStatus.Blocked]: borderColors.blocked,
    [ModuleStatus.Conflicted]: borderColors.conflicted,
  };

  return (
    <Card
      sx={{
        width: "216px",
        height: "110px",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor:
          backgroundColorMap[module.status ?? ModuleStatus.Planned], // Default to Unlocked
        border: isSelected
          ? `${selectedBorderWidth} solid ${theme.palette.custom.moduleCard.selectedBorderColor}`
          : `2px solid ${borderColorMap[module.status ?? ModuleStatus.Planned]}`,
        boxShadow: isSelected
          ? `0 0 0 ${selectedGlowWidth} ${theme.palette.custom.moduleCard.selectedBorderColor}80`
          : undefined,
        transition: "all 0.2s ease",
        "&:hover": {
          boxShadow: 6,
        },
        color: theme.palette.text.primary,
      }}
    >
      <CardContent>
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
