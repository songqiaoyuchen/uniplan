'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { memo } from 'react';
import SemesterColumn from './SemesterColumn';
import { useSemesterState } from '../../hooks';

interface TimetableSemesterProps {
  semesterId: number;
}

const TimetableSemester: React.FC<TimetableSemesterProps> = ({ semesterId }) => {
  const { moduleCodes, isDraggedOver } = useSemesterState(semesterId);

  const { setNodeRef } = useDroppable({
    id: semesterId,
    data: {
      type: 'semester',
      semesterId: semesterId,
  },
  });

  return (
    <div ref={setNodeRef}>
      <SortableContext items={moduleCodes}>
          <SemesterColumn moduleCodes={moduleCodes} semesterId={semesterId} isDraggedOver={isDraggedOver}/>
      </SortableContext>
    </div>
  );
};

export default memo(TimetableSemester);
