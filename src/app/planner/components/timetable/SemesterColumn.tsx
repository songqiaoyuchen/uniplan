// Presentational Layer

import Stack from '@mui/material/Stack';
import PlannerModule from './TimetableModule';
import { memo } from 'react';
import Box from '@mui/material/Box';

interface SemesterColumnProps {
  semesterId: number;
  moduleCodes: string[];
  isDraggedOver: boolean;
}

const SemesterColumn: React.FC<SemesterColumnProps> = ({ semesterId, moduleCodes, isDraggedOver }) => {
  return (
    <Box
      sx={{
        minWidth: { xs: '200px', md: '240px' },
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: isDraggedOver ? 'primary.main' : 'transparent',
        borderRadius: 1.5,
        padding: '2px',
        transition: 'border 0.2s ease',
        userSelect: 'none',
        height: '100%'
      }}
    >
      <Stack spacing={1} direction="column" sx={{ p: 1, gap: 1, height: '100%' }}>
        {moduleCodes.map((code) => (
          <PlannerModule key={code} moduleCode={code} semesterId={semesterId} />
        ))}
      </Stack>
    </Box>
  );
};

export default memo(SemesterColumn);
