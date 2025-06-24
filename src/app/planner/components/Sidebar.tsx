import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/sidebarSlice';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ModuleDetails from './ModuleDetails';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const selectedModuleId = useSelector((state: RootState) => state.planner.selectedModuleId);
  const modules = useSelector((state: RootState) => state.planner.modules);
  const selectedModule = selectedModuleId ? modules[selectedModuleId] : null;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  const sidebarWidth = 300;
  const mobileDrawerHeight = 300;

  if (isMobile) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: isOpen ? 0 : -mobileDrawerHeight,
          left: 0,
          right: 0,
          height: mobileDrawerHeight,
          backgroundColor: 'background.default',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          boxShadow: 4,
          overflowY: 'auto',
          transition: 'bottom 0.3s',
          zIndex: 1200, // High enough to appear above other content, but not block clicks outside
        }}
      >
        {/* Close Button */}
        <IconButton
          onClick={handleToggle}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Content */}
        <Box sx={{ p: 2 }}>
          {selectedModule && <ModuleDetails module={selectedModule} />}
        </Box>
      </Box>
    );
  }

  // Desktop Sidebar (unchanged)
  return (
    <Box
      sx={{
        position: 'fixed',
        top: '64px',
        bottom: 0,
        left: 0,
        width: sidebarWidth,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        backgroundColor: 'background.default',
        borderRight: 'solid 1px',
        borderColor: 'divider',
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
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
          },
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