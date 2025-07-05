'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { setActiveModule } from '@/store/plannerSlice';

interface MinModuleCardProps {
  moduleCode: string;
}

const MinModuleCard: React.FC<MinModuleCardProps> = ({ moduleCode }) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const moduleInfo = useSelector((state: RootState) => state.planner.modules[moduleCode]);

  const isPlanned = useSelector((state: RootState) =>
    state.planner.semesters.some((sem) => sem.includes(moduleCode))
  );

  const handleClick = () => {
    dispatch(setActiveModule(moduleCode));
    router.push(`?module=${moduleCode}`, { scroll: false });
  };

  const tooltipText = moduleInfo ? `${moduleCode}: ${moduleInfo.title}` : moduleCode;

  return (
    <Tooltip title={tooltipText} arrow>
      <Box
        onClick={handleClick}
        sx={{
          p: 1.5,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: isPlanned ? 'success.light' : 'background.paper',
          width: 'fit-content',
          minWidth: '100px',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <Typography variant="body2" fontWeight={600}>
          {moduleCode}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default MinModuleCard;
