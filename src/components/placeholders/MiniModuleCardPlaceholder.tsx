'use client';

import { Card, Skeleton, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

const MiniModuleCardPlaceholder: React.FC = () => {
  const theme = useTheme();

  return (
    <MotionCard
      sx={{
        p: 1,
        height: '40px',
        userSelect: 'none',
        backgroundColor: theme.palette.grey[100],
        border: `2px solid ${alpha(theme.palette.grey[400], 0.6)}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        transition: "transform 150ms ease, opacity 150ms ease, border-color 150ms ease",
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
      <Skeleton variant="text" width="80%" />
    </MotionCard>
  );
};

export default MiniModuleCardPlaceholder;
