'use client';

import { Box, Card, CardContent, Typography } from '@mui/material';
import { ModuleData } from '@/types/plannerTypes';
import { memo } from 'react';

interface ModuleCardProps {
  module: Pick<ModuleData, 'id' | 'code' | 'title'> | null;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  if (module) {
    return (
      <Card variant='outlined' sx={{width: '200px', height: '200px'}}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold">{module.code}</Typography>
          <Typography variant="body2">{module.title}</Typography>
        </CardContent>
      </Card>
      );
  } else {
    return (
      <Box sx={{width: '200px', height: '200px',
        borderColor: 'secondary.main',
        borderWidth: 1,
        borderStyle: 'solid'
      }} />
    );
  }
  
};

export default memo(ModuleCard);