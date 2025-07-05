'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store';
import { toggleSidebar } from '@/store/sidebarSlice';
import { addFetchedModule, setActiveModule } from '@/store/plannerSlice';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ModuleDetails from './ModuleDetails';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ModuleSearch from './ModuleSearch';
import { fetchModule } from '@/services/planner/fetchModule';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const activeModuleCode = useSelector((state: RootState) => state.planner.activeModuleCode);
  const modules = useSelector((state: RootState) => state.planner.modules);
  const fetchedModules = useSelector((state: RootState) => state.planner.fetchedModules);

  const resolvedModule = activeModuleCode
    ? modules[activeModuleCode] ?? fetchedModules[activeModuleCode] ?? null
    : null;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const sidebarWidth = 300;
  const mobileDrawerHeight = 300;

  const handleToggle = () => dispatch(toggleSidebar());

  useEffect(() => {
    if (!isOpen) {
      dispatch(setActiveModule(null));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
  const fetchIfNeeded = async () => {
    if (!activeModuleCode) return;
    const exists = modules[activeModuleCode] || fetchedModules[activeModuleCode];
    if (!exists) {
      try {
        const fetched = await fetchModule(activeModuleCode);
        dispatch(addFetchedModule(fetched));
        // You might not need to re-dispatch setActiveModule(fetched.code)
        // unless you anticipate the code might change during fetch
      } catch (err) {
        console.error(`Failed to fetch module ${activeModuleCode}`, err);
      }
    }
  };

  fetchIfNeeded();
}, [activeModuleCode, modules, fetchedModules, dispatch]);

  return isMobile ? (
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
        zIndex: 1200,
      }}
    >
      <IconButton onClick={handleToggle} size="small" sx={{ position: 'absolute', top: 8, right: 8 }}>
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: 2, gap: 2 }}>
        {isOpen && <ModuleSearch />}
        {resolvedModule && <ModuleDetails module={resolvedModule} />}
      </Box>
    </Box>
  ) : (
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
      }}
    >
      <IconButton
        onClick={handleToggle}
        size="small"
        sx={{
          position: 'absolute',
          top: 16,
          right: -18,
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

      <Box
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'flex-start',
          p: '26px',
          gap: 2,
          width: '100%',
          overflowY: 'auto',
          whiteSpace: 'normal',
        }}
      >
        {isOpen && <ModuleSearch />}
        {resolvedModule && isOpen && <ModuleDetails module={resolvedModule} />}
      </Box>
    </Box>
  );
};

export default Sidebar;
