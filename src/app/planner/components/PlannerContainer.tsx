'use client';

import Box from '@mui/material/Box';
import Timetable from './Timetable';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const PlannerContainer: React.FC = () => {
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? 300 : 36;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <Sidebar />

      {/* Main Content - pushes right based on sidebar width */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
          my: '16px',
          marginRight: { xs: 2, md: 4 },
          marginLeft: `${sidebarWidth + 32}px`, // Push based on sidebar width
          transition: 'margin-left 0.3s', // Smooth transition when sidebar toggles
          flex: 1,
          minWidth: 0,
        }}
      >
        <Timetable />
        <Box height={500}></Box>
      </Box>
    </Box>
  );
};

export default PlannerContainer;
