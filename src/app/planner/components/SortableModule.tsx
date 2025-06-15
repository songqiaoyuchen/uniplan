import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModuleCard from './ModuleCard';

interface SortableModuleProps {
  module: { id: string; code: string; title: string };
}

const SortableModule: React.FC<SortableModuleProps> = ({ module }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <ModuleCard module={module} />
    </div>
  );
};

export default SortableModule;
