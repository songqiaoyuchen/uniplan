'use client';

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
import PlannerSemester from './PlannerSemester';
import Box from '@mui/material/Box';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import PlannerModule from './PlannerModule';
import { RootState } from '@/store';
import { moveModule, reorderModules } from '@/store/plannerSlice';

const Timetable: React.FC = () => {
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
    setActiveId(event.active.id.toString());
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

    const moduleId = active.id.toString();
    const fromSemester = active.data.current?.module?.plannedSemester;
    const overSemester = over.data.current?.type === 'semester'
      ? Number(over.id)
      : over.data.current?.module?.plannedSemester;

    if (fromSemester === overSemester) {
      if (active.id !== over.id) {
        dispatch(reorderModules({
          semesterIndex: fromSemester,
          activeId: active.id.toString(),
          overId: over.id.toString(),
        }));
      }
    } else {
      // Moving across semesters
      dispatch(moveModule({ moduleId, fromSemester, toSemester: overSemester }));
    }

    setActiveId(null);
    setOverSemesterId(null);
  };

return (
<Box
  sx={{
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
  }}
>
  <DndContext
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
    sensors={sensors}
    collisionDetection={rectIntersection}
  >
    {semesters.map((_, index) => (
      <PlannerSemester
        key={index}
        semesterIndex={index}
        isActive={overSemesterId === index.toString()}
      />
    ))}

    {createPortal(
      <DragOverlay>{activeModule && <PlannerModule module={activeModule} />}</DragOverlay>,
      document.body
    )}
  </DndContext>
</Box>

);

};

export default Timetable;
