'use client';

import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  rectIntersection,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { useDispatch } from 'react-redux';
import PlannerModule from './PlannerModule';
import { addModule, moveModule, reorderModules } from '@/store/plannerSlice';
import PlannerSemester from './PlannerSemester';
import { ModuleData } from '@/types/plannerTypes';

const PlannerContainer: React.FC = () => {
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? 300 : 36;

    const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const dispatch = useDispatch();
  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const modules = useSelector((state: RootState) => state.planner.modules);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeModule = activeId ? modules[activeId] : null;
  const [overSemesterId, setOverSemesterId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString().split('-')[0].trim());
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;

    if (!over) {
      setOverSemesterId(null);
      return;
    }

    const overType = over.data.current?.type;

    if (overType === 'semester') {
      setOverSemesterId(over.id.toString());
    } else if (overType === 'module') {
      const moduleSemesterId = over.data.current?.module?.plannedSemester?.toString();
      if (moduleSemesterId !== undefined && moduleSemesterId !== null) {
        setOverSemesterId(moduleSemesterId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setOverSemesterId(null);
      return;
    }

    const moduleId = active.id.toString().split('-')[0].trim();
    const module = active.data.current?.module as ModuleData;
    const isNew = active.data.current?.isNew;

    const toSemester = over.data.current?.type === 'semester'
      ? Number(over.id)
      : over.data.current?.module?.plannedSemester;

    if (isNew && !modules[moduleId]) {
      dispatch(addModule(module));
    }

    const fromSemester = module.plannedSemester;
    if (fromSemester === toSemester) {
      if (active.id !== over.id) {
        dispatch(reorderModules({
          semesterIndex: fromSemester,
          activeId: active.id.toString(),
          overId: over.id.toString(),
        }));
      }
    } else {
      dispatch(moveModule({
        moduleId,
        fromSemester: module.plannedSemester,
        toSemester,
      }));    
    }

    setActiveId(null);
    setOverSemesterId(null);
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        collisionDetection={rectIntersection}
      >
        
        <Sidebar />

        {/* timetable */}
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
            my: '16px',
            marginRight: { xs: 2, md: 4 },
            marginLeft: { xs: 2, md: `${sidebarWidth + 32}px` }, 
            transition: 'margin-left 0.3s',
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* semesters */}
          <Box sx={{
              width: '100%',
              display: 'flex',
              minHeight: '650px',
              flexDirection: 'row',
              overflowX: 'auto',
              overflowY: 'hidden',
              p: 2,
              gap: 0,
              boxShadow: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
          }}>
            {semesters.map((_, index) => (
              <PlannerSemester
                key={index}
                semesterIndex={index}
                isActive={overSemesterId === index.toString()}
              />
            ))}
          </Box>
        </Box>

        {/* overlay modulecard */}
        {createPortal(
          <DragOverlay>{activeModule && <PlannerModule module={activeModule} />}</DragOverlay>,
          document.body
        )}
      </DndContext>
    </Box>
  );
};

export default PlannerContainer;
