'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModuleCard from './ModuleCard';
import { ModuleData } from '@/types/plannerTypes';
import Box from '@mui/material/Box';
import { closeSidebar, openSidebar } from '@/store/sidebarSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectModule } from '@/store/plannerSlice';
import { RootState } from '@/store';

interface PlannerModuleProps {
  module: ModuleData;
}

const PlannerModule: React.FC<PlannerModuleProps> = ({ module }) => {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    margin: 0,
  };

  const dispatch = useDispatch();
  const selectedModuleId = useSelector((state: RootState) => state.planner.selectedModuleId);
  const isSelected = selectedModuleId === module.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (isSelected) {
      dispatch(closeSidebar());
      dispatch(selectModule(null));
    } else {
      dispatch(selectModule(module.id));
      dispatch(openSidebar());
    }
  };

  return (
    <Box 
      ref={setNodeRef} 
      style={style} 
      onClick={handleClick}
      {...attributes} {...listeners} 
      sx={{
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <ModuleCard module={module} />
    </Box>
  );
};

export default PlannerModule;
