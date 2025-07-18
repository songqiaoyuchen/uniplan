// Presentational Layer

import Stack from '@mui/material/Stack';
import TimetableModule from './TimetableModule';
import { memo } from 'react';
import Box from '@mui/material/Box';
import { useAppSelector } from '@/store';

interface SemesterColumnProps {
  semesterId: number;
  moduleCodes: string[];
  isDraggedOver: boolean;
}

const SemesterColumn: React.FC<SemesterColumnProps> = ({ semesterId, moduleCodes, isDraggedOver }) => {
  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: isDraggedOver ? 'primary.main' : 'transparent',
        borderRadius: 1.5,
        padding: isMinimalView ? 0.5 : 1,
        backgroundColor: "background.paper",
        transition: 'border 0.2s ease',
        userSelect: 'none',
        height: '100%',
      }}
    >
      <Stack spacing={1} direction="column" sx={{ gap: 1, height: '100%' }}>
        {moduleCodes.map((code) => (
          <TimetableModule key={code} moduleCode={code} semesterId={semesterId} />
        ))}
      </Stack>
    </Box>
  );
};

export default memo(SemesterColumn);
