'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import Timetable from './Timetable';

export type LayoutView = 'horizontal' | 'vertical';

const PlannerContainer: React.FC = () => {
  const [layout, setLayout] = useState<LayoutView>('horizontal');

  const toggleLayout = () => {
    setLayout((prevLayout) => (prevLayout === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  return (
    <Box
      sx={{
        mx: 'auto',
        padding: { xs: 2, md: 4 },
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        width: '100%'
      }}
    >
      {/* conntrol panel */}
      <Box sx={{ width: '20%', border: '1px solid white', borderRadius: 1}}>
        <Button
          variant="outlined"
          onClick={toggleLayout}
          startIcon={layout === 'horizontal' ? <ViewStreamIcon /> : <ViewWeekIcon />}
        >
          {layout === 'horizontal' ? 'Vertical View' : 'Horizontal View'}
        </Button>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Timetable layout={layout} />
      </Box>
    </Box>
  );
};

export default PlannerContainer;