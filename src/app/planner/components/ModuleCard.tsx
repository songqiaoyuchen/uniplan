'use client';

import { RootState } from '@/store';
import { ModuleData, ModuleStatus } from '@/types/plannerTypes';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { memo } from 'react';
import { useSelector } from 'react-redux';

interface ModuleCardProps {
  module: Pick<ModuleData, 'id' | 'code' | 'title' | 'status'>;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  const theme = useTheme();
  const activeModuleCode = useSelector((state: RootState) => state.planner.activeModuleCode);
  const isSelected = activeModuleCode === module.code;

  const { 
    selectedBorderWidth, 
    selectedGlowWidth, backgroundColors, 
    borderColors 
  } = theme.palette.custom.moduleCard;

  const backgroundColorMap: Record<ModuleStatus, string> = {
    [ModuleStatus.Completed]: backgroundColors.completed,
    [ModuleStatus.Unlocked]: backgroundColors.unlocked,
    [ModuleStatus.Locked]: backgroundColors.locked,
    [ModuleStatus.Blocked]: backgroundColors.blocked,
    [ModuleStatus.Conflicted]: backgroundColors.conflicted, 
  };

  const borderColorMap: Record<ModuleStatus, string> = {
    [ModuleStatus.Completed]: borderColors.completed,
    [ModuleStatus.Unlocked]: borderColors.unlocked,
    [ModuleStatus.Locked]: borderColors.locked,
    [ModuleStatus.Blocked]: borderColors.blocked,
    [ModuleStatus.Conflicted]: borderColors.conflicted,
  };

  return (
    <Card
      sx={{
        width: '216px',
        height: '110px',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: backgroundColorMap[module.status ?? ModuleStatus.Unlocked], // Default to Unlocked
        border: isSelected
          ? `${selectedBorderWidth} solid ${theme.palette.custom.moduleCard.selectedBorderColor}`
          : `2px solid ${borderColorMap[module.status ?? ModuleStatus.Unlocked]}`,
        boxShadow: isSelected
          ? `0 0 0 ${selectedGlowWidth} ${theme.palette.custom.moduleCard.selectedBorderColor}80`
          : undefined,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 6,
        },
        color: theme.palette.text.primary,
      }}
    >
      <CardContent>
        <Typography variant='subtitle2' fontWeight='bold' display='inline'>
          {module.code}
        </Typography>
        <Typography variant='body2' display='inline' sx={{ ml: 1 }}>
          {module.title}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default memo(ModuleCard);
