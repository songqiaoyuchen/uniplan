'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import PlannerModule from './PlannerModule';
import { memo } from 'react';
import { shallowEqual } from 'react-redux';
import { useDraggable } from '@dnd-kit/core';
import { IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Typography } from '@mui/material';

interface PlannerSemesterProps {
  semesterIndex: number;
  isActive: boolean; // highlight on hover
}

const PlannerSemester: React.FC<PlannerSemesterProps> = ({
  semesterIndex,
  isActive,
}) => {
  const moduleIds = useSelector(
    (state: RootState) => state.planner.semesters[semesterIndex],
    shallowEqual
  );
  const allModules = useSelector((state: RootState) => state.planner.modules);
  const modules = moduleIds.map((id) => allModules[id]).filter(Boolean);

  const { setNodeRef } = useDroppable({
    id: semesterIndex,
    data: { type: 'semester' },
  });

  return (
    <Box
      sx={{
        minWidth: { xs: '200px', md: '240px' },
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid',
        borderColor: isActive ? 'primary.main' : 'transparent',
        borderRadius: 1.5,
        padding: '2px',
        transition: 'border 0.2s ease',
        userSelect: 'none'
      }}
    >
      <Stack
        ref={setNodeRef}
        spacing={1}
        direction={'column'}
        sx={{
          p: 1,
          gap: 1,
          height: '100%'
        }}
      >
        <SortableContext items={moduleIds}>
          {modules.map((mod) => (
            <PlannerModule key={mod.id} module={mod} />
          ))}
        </SortableContext>
      </Stack>
    </Box>
  );
};

export default memo(PlannerSemester);
