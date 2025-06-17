'use client';

import { useEffect, useState } from 'react'; 
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay, 
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from '@dnd-kit/core'; 
import { LayoutView } from './PlannerContainer';
import { ModuleData } from '@/types/plannerTypes';
import PlannerSemester from './PlannerSemester';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import PlannerModule from './PlannerModule';
import { RootState } from '@/store';
import { moveModule } from '@/store/plannerSlice';

interface TimetableProps {
  layout: LayoutView;
}

const Timetable: React.FC<TimetableProps> = ({ layout }) => {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeModule, setActiveModule] = useState<ModuleData | null>(null);
  const dispatch = useDispatch();

  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const modules = useSelector((state: RootState) => state.planner.modules);

  // Track the current drag over state for preview
  const [overSemester, setOverSemester] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'module') {
      setActiveModule(event.active.data.current.module);
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    
    if (!over) {
      setOverSemester(null);
      setOverIndex(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const overData = over.data.current;

    // SCENARIO 1: We are hovering over a semester container
    if (overData?.type === 'semester') {
      const semesterIndex = parseInt(overId as string);
      const moduleCount = semesters[semesterIndex]?.length ?? 0;

      setOverSemester(semesterIndex);
      setOverIndex(moduleCount); // Placeholder goes at the end
    } 
    // SCENARIO 2: We are hovering over another module
    else if (overData?.type === 'module') {
      const targetModuleId = overId as string;
      const targetModule = modules[targetModuleId];

      if (!targetModule) return;

      const semesterIndex = targetModule.plannedSemester;
      const moduleIndex = semesters[semesterIndex]?.indexOf(targetModuleId);

      if (moduleIndex !== -1) {
        setOverSemester(semesterIndex);
        setOverIndex(moduleIndex); // Placeholder goes at this module's position
      }
    }
  }

  function onDragEnd(event: DragEndEvent) {
    console.log("dragend begin")
    const { active, over } = event;
    if (!over) {
      setActiveModule(null);
      setOverSemester(null);
      setOverIndex(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) {
      setActiveModule(null);
      setOverSemester(null);
      setOverIndex(null);
      return;
    }

    const moduleId = activeId as string;
    const fromSemester = modules[moduleId]?.plannedSemester;

    if (fromSemester === undefined) {
      console.error('Source module not found.');
      setActiveModule(null);
      setOverSemester(null);
      setOverIndex(null);
      return;
    }

    const fromIndex = semesters[fromSemester].indexOf(moduleId);
    if (fromIndex === -1) {
      console.error('Source module position not found.');
      setActiveModule(null);
      setOverSemester(null);
      setOverIndex(null);
      return;
    }

    // Determine target semester and index
    let toSemester: number;
    let toIndex: number;

    if (over.data.current?.type === 'semester') {
      // Dropping into an empty area of a semester
      toSemester = parseInt(overId as string);
      toIndex = semesters[toSemester].length; // Add to end
    } else {
      // Dropping onto another module
      const targetModuleId = over.id as string;
      const targetModule = modules[targetModuleId];

      if (!targetModule) {
        console.error('Target module not found.');
        setActiveModule(null);
        setOverSemester(null);
        setOverIndex(null);
        return;
      }

      toSemester = targetModule.plannedSemester;
      toIndex = semesters[toSemester].indexOf(targetModuleId);

      if (toIndex === -1) {
        console.error('Target module position not found.');
        setActiveModule(null);
        setOverSemester(null);
        setOverIndex(null);
        return;
      }
    }

    console.log("dragend finish")
    // Always dispatch moveModule, regardless of whether it's same semester or not
    dispatch(
      moveModule({
        from: { semester: fromSemester, index: fromIndex },
        to: { semester: toSemester, index: toIndex },
        moduleId,
      })
    );

    // Clean up state after dispatching
    setActiveModule(null);
    setOverSemester(null);
    setOverIndex(null);
  }

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
          onDragStart={onDragStart} 
          onDragEnd={onDragEnd} 
          onDragOver={onDragOver}
          sensors={sensors}
        >
          {Array.from({length: 8}).map((_, index) => (
            <PlannerSemester
              key={index}
              semesterIndex={index}
              moduleIds={semesters[index] || []}
              layout={layout}
            />
          ))}

          {createPortal(
            <DragOverlay>
              {activeModule && <PlannerModule module={activeModule}/>}
            </DragOverlay>, 
            document.body
          )}
        </DndContext>
      </Box>
    </Paper>
  );
};

export default Timetable;