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
import { ModuleData } from '@/types/plannerTypes';
import ModuleCard from './ModuleCard';

interface PlannerSemesterProps {
  semesterIndex: number;
  moduleIds: string[];
  layout: LayoutView;
}

const PlannerSemester: React.FC<PlannerSemesterProps> = ({ semesterIndex, moduleIds, layout }) => {

  const allModules = useSelector((state: RootState) => state.planner.modules);
  const modules = moduleIds.map((id) => allModules[id]).filter(Boolean);

  const isHorizontalLayout = layout === 'horizontal';

  const { setNodeRef } = useDroppable({
    id: semesterIndex,
    data: {
      type: 'semester',
    },
  });

  return (
    <Box
      sx={{
        minWidth: isHorizontalLayout ? '200px' : '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom>
        {semesterIndex}
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
        }}
      >
        <SortableContext
          items={moduleIds}
        >
          {modules.map((mod) => (
            <PlannerModule key={mod.id} module={mod} />
          ))}
        </SortableContext>
      </Stack>
    </Box>
  );
};

export default PlannerSemester;