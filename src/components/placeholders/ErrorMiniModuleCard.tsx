'use client';

import { Card, Typography, useTheme } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const MiniErrorModuleCard: React.FC = () => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 1,
        userSelect: 'none',
        backgroundColor: theme.palette.error.light,
        border: `2px solid ${theme.palette.error.main}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        color: theme.palette.error.main,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <ErrorOutlineIcon fontSize="small" />
      <Typography
        variant="body2"
        fontWeight='bold'
      >
        Error
      </Typography>
    </Card>
  );
};

export default MiniErrorModuleCard;
