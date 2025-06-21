'use client';

import { RootState } from '@/store';
import { ModuleData, ModuleStatus } from '@/types/plannerTypes';
import { useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import { useSelector } from 'react-redux';

interface ModuleCardProps {
  module: Pick<ModuleData, 'id' | 'code' | 'title' | 'status'>;
}

const moduleStatusColors: Record<ModuleStatus, string> = {
  [ModuleStatus.Completed]: 'success.main',
  [ModuleStatus.Unlocked]: 'primary.main',
  [ModuleStatus.Locked]: 'error.main',
  [ModuleStatus.Blocked]: 'warning.main',
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const selectedModuleId = useSelector((state: RootState) => state.planner.selectedModuleId);
  const isSelected = selectedModuleId === module.id;

  return (
    <Card sx={{
      width: '100%',
      height: '110px',
      useSelect: 'none',
      cursor: 'pointer',
      backgroundColor: moduleStatusColors[module.status],
      border: '2px solid',
      color: 'black',
      borderColor: isSelected ? 'secondary.main' : 'transparent',
      '&:hover': {
          boxShadow: 6,
          opacity: 0.85,
        },
    }}>
      <CardContent>
        <Typography variant='subtitle2' fontWeight='bold' display='inline'>{module.code}</Typography> 
        <Typography variant="body2" display='inline'>&nbsp;&nbsp;{module.title}</Typography>
      </CardContent>
    </Card>
    );
};

export default memo(ModuleCard);