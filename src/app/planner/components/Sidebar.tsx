import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/sidebarSlice';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ModuleDetails from './ModuleDetails';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const selectedModuleId = useSelector((state: RootState) => state.planner.selectedModuleId);
  const modules = useSelector((state: RootState) => state.planner.modules);
  const selectedModule = selectedModuleId ? modules[selectedModuleId] : null;

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  const sidebarWidth = 300;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        bottom: 0,
        left: 0,
        width: sidebarWidth,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
        borderRight: 'solid 1px',
        borderColor: 'action.hover',
        transform: isOpen ? 'translateX(0)' : `translateX(-${sidebarWidth - 38}px)`,
        transition: 'transform 0.3s',
        zIndex: 1200,
      }}
    >
      {/* Collapse/Expand Button */}
      <IconButton
        onClick={handleToggle}
        size="medium"
        sx={{
          position: 'absolute',
          top: 16,
          right: -20,
          zIndex: 1500,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'action.hover',
          '&:hover': { backgroundColor: 'action.hover' },
        }}
      >
        {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>

      {/* Sidebar Content */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-start',
          p: '32px',
          gap: 2,
          width: '100%',
          overflowY: 'auto',
          whiteSpace: 'normal',
        }}
      >
        {selectedModule && isOpen && <ModuleDetails module={selectedModule} />}
      </Box>
    </Box>
  );
};

export default Sidebar;
