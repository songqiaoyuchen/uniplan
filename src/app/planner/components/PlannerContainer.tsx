'use client';

import Box from '@mui/material/Box';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useEffect, useState } from 'react';
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
import { addModule, moveModule, reorderModules, setModules } from '@/store/plannerSlice';
import PlannerSemester from './PlannerSemester';
import { ModuleData } from '@/types/plannerTypes';
import { checkConflicts } from '@/utils/planner/checkConflicts';
import { updateModules } from '@/store/plannerSlice'; 

const PlannerContainer: React.FC = () => {
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? 300 : 36;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const dispatch = useDispatch();
  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const modules = useSelector((state: RootState) => state.planner.modules);

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const activeModule = activeCode ? modules[activeCode] : null;
  const [overSemesterId, setOverSemesterId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCode(event.active.id.toString().split('-')[0].trim());
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
      setActiveCode(null);
      setOverSemesterId(null);
      return;
    }

    const moduleCode = active.id.toString().split('-')[0].trim();
    const module = active.data.current?.module as ModuleData;
    const isNew = active.data.current?.isNew;

    const toSemester = over.data.current?.type === 'semester'
      ? Number(over.id)
      : over.data.current?.module?.plannedSemester;

    let modulesChanged = false;
    let nextModules = { ...modules };

    if (isNew && !modules[moduleCode]) {
      dispatch(addModule(module));
      nextModules[moduleCode] = module;
    }

    const fromSemester = module.plannedSemester;
    if (fromSemester === toSemester && fromSemester !== null) {
      if (active.id !== over.id) {
        dispatch(reorderModules({
          semesterIndex: fromSemester,
          activeCode: active.id.toString(),
          overCode: over.id.toString(),
        }));
      }
    } else {
      dispatch(moveModule({
        moduleCode,
        fromSemester: module.plannedSemester,
        toSemester,
      }));
      nextModules[moduleCode] = {
        ...nextModules[moduleCode],
        plannedSemester: toSemester,
      };
      modulesChanged = true;
    }

    if (modulesChanged) {
      const updatedModules = checkConflicts(nextModules);
      dispatch(updateModules(updatedModules));
    }

    setActiveCode(null);
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
