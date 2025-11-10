'use client';

import { Box, Typography, useTheme, alpha } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ErrorModuleTooltipProps {
  message?: string;
}

const ErrorModuleTooltip: React.FC<ErrorModuleTooltipProps> = ({
  message = 'Failed to load module details.',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 1,
        backgroundColor: alpha(theme.palette.error.light, 0.3),
        border: `1px solid ${theme.palette.error.main}`,
        color: theme.palette.error.main,
        maxWidth: 260,
        fontSize: '0.875rem',
      }}
    >
      <ErrorOutlineIcon fontSize="small" />
      <Typography
        variant="body2"
        sx={{
          fontWeight: 500,
          overflowWrap: 'break-word',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default ErrorModuleTooltip;
