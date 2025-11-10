'use client';

import { Card, Box } from '@mui/material';
import { motion } from 'framer-motion';

const MotionCard = motion.create(Card);

const ModuleCardPlaceholder: React.FC = () => {
  return (
    <MotionCard
      sx={{
        minWidth: '225px',
        height: "105px",
        userSelect: 'none',
        borderRadius: 1,
        backgroundColor: 'grey.300',
        border: '2px solid',
        borderColor: 'grey.400',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      animate={{
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Box
        sx={{
          width: '60%',
          height: 12,
          backgroundColor: 'grey.400',
          borderRadius: 1,
          mb: 0.5,
        }}
      />
      <Box
        sx={{
          width: '40%',
          height: 10,
          backgroundColor: 'grey.400',
          borderRadius: 1,
          alignSelf: 'flex-end',
        }}
      />
    </MotionCard>
  );
};

export default ModuleCardPlaceholder;
