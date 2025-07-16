'use client';

// Presentational Layer

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { memo } from 'react';
import { ModuleStatus } from '@/types/plannerTypes';
import { useTheme } from '@mui/material';
import { useModuleCardColors } from '../../hooks';

interface MiniModuleCardProps {
  moduleCode: string;
  moduleTitle: string;
  isPlanned: boolean;
  status?: ModuleStatus;
}

const MiniModuleCard: React.FC<MiniModuleCardProps> = ({ moduleCode, moduleTitle, isPlanned, status }) => {
  const theme = useTheme();
  const { backgroundColor } = useModuleCardColors(status);

  return (
    <Box
      sx={{
        m: 0.5,
        p: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: isPlanned ? backgroundColor : theme.palette.background.paper,
        width: 'fit-content',
        cursor: isPlanned ? 'pointer' : 'grab',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: isPlanned ? backgroundColor : 'action.hover',
        },
        '&:active': {
          cursor: isPlanned ? 'not-allowed' : 'grabbing',
        },
      }}
    >
      <Tooltip title={`${moduleCode}: ${moduleTitle}`} arrow placement="right">
        <Typography variant="body2" fontWeight={600}>
          {moduleCode}
        </Typography>
      </Tooltip>
    </Box>
  );
};

export default memo(MiniModuleCard);
