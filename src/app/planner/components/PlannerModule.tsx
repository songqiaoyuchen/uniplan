'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModuleCard from './ModuleCard';
import { ModuleData } from '@/types/plannerTypes';
import Box from '@mui/material/Box';

interface PlannerModuleProps {
  module: ModuleData;
}

const PlannerModule: React.FC<PlannerModuleProps> = ({ module }) => {
  if (!module) {
    return <ModuleCard module={null} />;
  }

  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging } = useSortable({
    id: module.id,
    data: {
      type: 'module',
      module,
    },
  });

  // performance-critical styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ModuleCard module={isDragging ? null : module} />
    </Box>
  );
};

export default PlannerModule;