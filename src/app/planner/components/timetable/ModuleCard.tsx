"use client";

// Presentational Layer

import { ModuleData, ModuleStatus } from "@/types/plannerTypes";
import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { memo } from "react";
import { useModuleCardColors } from "../../hooks";
import Box from "@mui/material/Box";
import Tag from "@/components/ui/Tag";

interface ModuleCardProps {
  module: Pick<ModuleData, "code" | "title" | "status" | "credits" | "grade">;
  isSelected?: boolean;
  isRelated?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isSelected = false, isRelated = false }) => {
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
        minWidth: '225px',
        height: "105px",
        cursor: "pointer",
        userSelect: "none",
        backgroundColor,
        border: isSelected
          ? `${selectedBorderWidth} solid ${selectedBorderColor}`
          : isRelated
          ? `2px solid white`
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
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        padding: 1.5
      }}>
        {/* title and grade */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <Box component="span" fontWeight="bold">{module.code}</Box> {module.title}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
            {module.grade ?? '-'}
          </Typography>
        </Box>
        {/* unit and tags */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}
        >
          {/* Units */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            {module.credits} Units
          </Typography>

          {/* Chips */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap-reverse',
              flexDirection: 'row-reverse',
              gap: 0.5,
              overflow: 'hidden',
              alignContent: 'flex-end',
              justifyContent: 'flex-start',
              flexGrow: 1,
            }}
          >
            <Tag text="Sample" />
            <Tag text="Sample" />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default memo(ModuleCard);
