'use client';

// Presentational Layer

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { memo } from 'react';

interface MiniModuleCardProps {
  moduleCode: string;
  moduleTitle: string;
  isPlanned: boolean;
}

const MiniModuleCard: React.FC<MiniModuleCardProps> = ({ moduleCode, moduleTitle, isPlanned }) => {
  return (
    <Box
      sx={{
        m: 0.5,
        p: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: isPlanned ? 'primary.main' : 'background.paper',
        width: 'fit-content',
        cursor: isPlanned ? 'pointer' : 'grab',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: 'action.hover',
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
