'use client';

import { Card, Skeleton, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion(Card);

const ModuleTooltipPlaceholder: React.FC = () => {
  const theme = useTheme();

  return (
    <MotionCard
      sx={{
        m: 0.5,
        p: 0.5,
        width: '70px',
        height: '30px',
        userSelect: 'none',
        backgroundColor: theme.palette.grey[100],
        border: `2px solid ${alpha(theme.palette.grey[400], 0.6)}`,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 4,
        },
      }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Skeleton variant="text" width="80%"/>
    </MotionCard>
  );
};

export default ModuleTooltipPlaceholder;
