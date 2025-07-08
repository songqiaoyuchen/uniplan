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

interface PlannerSemesterProps {
  semesterIndex: number;
  isActive: boolean; // highlight on hover
}

const PlannerSemester: React.FC<PlannerSemesterProps> = ({
  semesterIndex,
  isActive,
}) => {
  // Select only the module codes for this semester
  const moduleCodes = useSelector(
    (state: RootState) => state.planner.semesters[semesterIndex],
    shallowEqual
  );
  // Select only the modules for this semester
  const modules = useSelector(
    (state: RootState) => moduleCodes.map((code) => state.planner.modules[code]).filter(Boolean),
    shallowEqual
  );

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
        <SortableContext items={moduleCodes}>
          {modules.map((mod) => (
            <PlannerModule key={mod.code} module={mod} />
          ))}
        </SortableContext>
      </Stack>
    </Box>
  );
};

export default memo(PlannerSemester);