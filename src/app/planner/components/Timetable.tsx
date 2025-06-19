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
import { LayoutView } from './PlannerContainer';
import PlannerSemester from './PlannerSemester';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import PlannerModule from './PlannerModule';
import { RootState } from '@/store';
import { moveModule, reorderModules } from '@/store/plannerSlice';

interface TimetableProps {
  layout: LayoutView;
}

const Timetable: React.FC<TimetableProps> = ({ layout }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const dispatch = useDispatch();
  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const modules = useSelector((state: RootState) => state.planner.modules);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overSemesterId, setOverSemesterId] = useState<string | null>(null);

  const activeModule = activeId ? modules[activeId] : null;

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
    <Paper elevation={2} sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: layout === 'horizontal' ? 'row' : 'column',
          overflowX: layout === 'horizontal' ? 'auto' : 'hidden',
          overflowY: layout === 'horizontal' ? 'hidden' : 'auto',
          p: 2,
          gap: 2,
          minHeight: '400px',
        }}
      >
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          collisionDetection={rectIntersection}
        >
          {semesters.map((moduleIds, index) => (
            <PlannerSemester
              key={index}
              semesterIndex={index}
              layout={layout}
              isActive={overSemesterId === index.toString()}
            />
          ))}

          {createPortal(
            <DragOverlay>{activeModule && <PlannerModule module={activeModule} />}</DragOverlay>,
            document.body
          )}
        </DndContext>
      </Box>
    </Paper>
  );
};

export default Timetable;
