'use client';

// Presentational Layer

import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { memo } from 'react';
import { ModuleData, ModuleStatus } from '@/types/plannerTypes';
import { Card, useTheme, alpha } from '@mui/material';
import { useModuleCardColors } from '../../hooks';

interface MiniModuleCardProps {
  module: Pick<ModuleData, 'code' | 'title' | 'status'>;
  isSelected?: boolean;
  isDragging?: boolean;
  isRelated?: boolean;
}

const MiniModuleCard: React.FC<MiniModuleCardProps> = ({ module, isSelected = false, isDragging = false, isRelated = false }) => {
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
        p: 1,
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor,
        border: isSelected
          ? `${selectedBorderWidth} solid ${alpha(selectedBorderColor, 0.8)}`
          : isRelated
          ? `2px solid white`
          : `2px solid ${alpha(borderColor, 0.5)}`,
        boxShadow: isSelected
          ? `0 0 0 ${selectedGlowWidth} ${alpha(selectedBorderColor, 0.5)}`
          : undefined,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 6,
        },
        color: theme.palette.text.primary,
        minWidth: 80,
      }}
    >
      <Tooltip 
        disableTouchListener={isDragging}
        disableFocusListener={isDragging}
        disableHoverListener={isDragging}
        title={`${module.code}: ${module.title}`} arrow placement="right"
        slotProps={{
          popper: {
            modifiers: [
              {
                name: 'customStyle',
                enabled: true,
                phase: 'beforeWrite',
                fn: ({ state }) => {
                  Object.assign(state.elements.popper.style, {
                    userSelect: 'none',
                    cursor: 'default',
                  });
                },
              },
            ],}
        }}>
        <Typography variant="body2" fontWeight="bold" textAlign="center">
          {module.code}
        </Typography>
      </Tooltip>
    </Card>
  );
};

export default memo(MiniModuleCard);
