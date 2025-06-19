'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { LayoutView } from './PlannerContainer';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import PlannerModule from './PlannerModule';
import { memo } from 'react';
import { shallowEqual } from 'react-redux';

interface PlannerSemesterProps {
  semesterIndex: number;
  layout: LayoutView;
  isActive: boolean; // highlight on hover
}

const PlannerSemester: React.FC<PlannerSemesterProps> = ({
  semesterIndex,
  layout,
  isActive,
}) => {
  const moduleIds = useSelector(
    (state: RootState) => state.planner.semesters[semesterIndex],
    shallowEqual
  );
  const allModules = useSelector((state: RootState) => state.planner.modules);
  const modules = moduleIds.map((id) => allModules[id]).filter(Boolean);
  const isHorizontalLayout = layout === 'horizontal';

  const { setNodeRef } = useDroppable({
    id: semesterIndex,
    data: { type: 'semester' },
  });

  return (
    <Box
      sx={{
        minWidth: isHorizontalLayout ? '210px' : '100%',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid',
        borderColor: isActive ? 'secondary.main' : 'transparent',
        borderRadius: 1.5,
        transition: 'border 0.2s ease',
      }}
    >
      <Typography variant="h6" gutterBottom textAlign="center">
        Semester {semesterIndex + 1}
      </Typography>
      <Stack
        ref={setNodeRef}
        spacing={1}
        direction={isHorizontalLayout ? 'column' : 'row'}
        sx={{
          flexGrow: 1,
          overflowY: isHorizontalLayout ? 'auto' : 'hidden',
          overflowX: isHorizontalLayout ? 'hidden' : 'auto',
          minHeight: isHorizontalLayout ? '1000px' : 'auto',
          minWidth: isHorizontalLayout ? 'auto' : '100%',
          p: 1,
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
