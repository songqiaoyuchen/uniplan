import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, Typography, Stack } from '@mui/material';
import SortableModule from './SortableModule';

interface SemesterProps {
  semesterIndex: number;
  label: string;
  modules: { id: string; code: string; title: string }[];
}

const Semester: React.FC<SemesterProps> = ({ semesterIndex, label, modules }) => {
  const { setNodeRef } = useDroppable({ id: `semester-${semesterIndex}` });

  return (
    <Card sx={{ minHeight: '200px' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{label}</Typography>
        <Stack spacing={1} ref={setNodeRef}>
          <SortableContext
            items={modules.map((mod) => mod.id)}
            strategy={verticalListSortingStrategy}
          >
            {modules.map((mod) => (
              <SortableModule
                key={mod.id}
                module={mod}
              />
            ))}
          </SortableContext>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Semester;
