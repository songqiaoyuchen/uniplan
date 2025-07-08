'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import { setActiveModule } from '@/store/plannerSlice';
import { useDraggable } from '@dnd-kit/core';
import { useEffect, useState } from 'react';
import { fetchModuleTitle } from '@/services/planner/fetchModuleTitle';

interface MinModuleCardProps {
  moduleCode: string;
}

const MinModuleCard: React.FC<MinModuleCardProps> = ({ moduleCode }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [title, setTitle] = useState(moduleCode);

  useEffect(() => {
    fetchModuleTitle(moduleCode).then(setTitle);
  }, [moduleCode]);

  const isPlanned = useSelector(
    (state: RootState) => moduleCode in state.planner.modules
  );

  const handleClick = () => {
    dispatch(setActiveModule(moduleCode));
    router.push(`?module=${moduleCode}`, { scroll: false });
  };

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: moduleCode + '-prereq',
    disabled: isPlanned, // ✅ disables drag
    data: {
      type: 'module',
      moduleCode,
      isNew: true,
      dragActivationConstraint: {
        distance: 3,
      },
    },
  });

  return (
    <Box
      ref={setNodeRef}
      {...(isPlanned ? {} : listeners)}
      {...attributes}
      onClick={handleClick}
      sx={{
        m: 0.5,
        p: 0.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        backgroundColor: isPlanned ? 'primary.main' : 'background.paper',
        width: 'fit-content',
        cursor: isPlanned ? 'pointer' : 'grab', // ✅ cursor feedback
        userSelect: 'none',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
        '&:active': {
          cursor: isPlanned ? 'not-allowed' : 'grabbing',
        },
      }}
    >
      <Tooltip title={`${moduleCode}: ${title}`} arrow placement="right">
        <Typography variant="body2" fontWeight={600}>
          {moduleCode}
        </Typography>
      </Tooltip>
    </Box>
  );
};

export default MinModuleCard;
