'use client';

import { useCallback, useState } from 'react'; 
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay, 
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  rectIntersection
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // pixels to move before drag starts
      },
    })
  );

  const [activeModule, setActiveModule] = useState<ModuleData | null>(null);
  const dispatch = useDispatch();

  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const modules = useSelector((state: RootState) => state.planner.modules);

  const [tempSemesters, setTempSemesters] = useState<string[][]>(() =>
  semesters.map((semester) => [...semester])
);

  function onDragStart(event: DragStartEvent) {
    setActiveModule(event.active.data.current?.module);
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    // Prepare the new tempSemesters
    let newTempSemesters = tempSemesters.map(semester => semester.filter(id => id !== activeId));

    if (over.data.current?.type === 'semester') {
      // Dropping over empty space of a semester → Append to end
      const targetSemesterIndex = parseInt(overId); // assuming overId is the semester index

      if (targetSemesterIndex < 0 || targetSemesterIndex >= tempSemesters.length) return;

      newTempSemesters[targetSemesterIndex].push(activeId);

      // Update state
      setTempSemesters(newTempSemesters);
      return;
    }

    if (over.data.current?.type === 'module') {
      const overSemesterIndex = tempSemesters.findIndex(semester => semester.includes(overId));
      const overPosition = tempSemesters[overSemesterIndex]?.indexOf(overId);

      if (overSemesterIndex === -1 || overPosition === -1) return;

      // Insert activeId into the semester at the new position
      newTempSemesters[overSemesterIndex].splice(overPosition, 0, activeId);

      // Update state
      setTempSemesters(newTempSemesters);
      return;
    }

    // If neither, do nothing
  }

  function onDragEnd(event: DragEndEvent) {
    console.log("dragend begin");
    const { active, over } = event;

    if (!over) {
      setActiveModule(null);
      return;
    }

    const activeId = active.id.toString();
    const moduleId = activeId;

    // Find final position in tempSemesters
    let toSemester = -1;
    let toIndex = -1;

    for (let i = 0; i < tempSemesters.length; i++) {
      const index = tempSemesters[i].indexOf(moduleId);
      if (index !== -1) {
        toSemester = i;
        toIndex = index;
        break;
      }
    }

    if (toSemester === -1 || toIndex === -1) {
      console.error('Final drop position not found in tempSemesters.');
      setActiveModule(null);
      return;
    }

    // Find original position in semesters
    const fromSemester = modules[moduleId]?.plannedSemester;

    if (fromSemester === undefined) {
      console.error('Source module not found.');
      setActiveModule(null);
      return;
    }

    const fromIndex = semesters[fromSemester].indexOf(moduleId);

    if (fromIndex === -1) {
      console.error('Source module position not found.');
      setActiveModule(null);
      return;
    }

    console.log("Dispatching moveModule");
    console.log({
        from: { semester: fromSemester, index: fromIndex },
        to: { semester: toSemester, index: toIndex },
        moduleId,
      })
    dispatch(
      moveModule({
        from: { semester: fromSemester, index: fromIndex },
        to: { semester: toSemester, index: toIndex },
        moduleId,
      })
    );

    setActiveModule(null);
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
          collisionDetection={rectIntersection}
        >
          {Array.from({length: 10}).map((_, index) => {
            return (
              <PlannerSemester
                key={index}
                semesterIndex={index}
                moduleIds={tempSemesters[index] || []}
                layout={layout}
              />
            );
          })}

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