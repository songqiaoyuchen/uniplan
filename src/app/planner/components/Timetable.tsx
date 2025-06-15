import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import Semester from './Semester';
import { Box, Typography, Grid } from '@mui/material';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import {
  moveModuleWithinSemester,
  moveModuleToAnotherSemester,
} from '@/store/plannerSlice';

const semesterLabels = ['Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2'];

const Timetable: React.FC = () => {
  const modules = useSelector((state: RootState) => state.planner.modules || {});
  const semesters = useSelector((state: RootState) => state.planner.semesters || {}) as Record<string, string[]>;
  const dispatch = useDispatch();

  const findSemesterOfModule = (moduleId: string) => {
    return Object.entries(semesters).find(([_, ids]) => ids.includes(moduleId))?.[0];
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) return;

    const activeSemesterStr = findSemesterOfModule(activeId);
    const overSemesterStr = findSemesterOfModule(overId);

    if (!activeSemesterStr || !overSemesterStr) return;

    const activeSemester = Number(activeSemesterStr);
    const overSemester = Number(overSemesterStr);

const activeIndex = (semesters[activeSemester] ?? []).indexOf(activeId);
const overIndex = (semesters[overSemester] ?? []).indexOf(overId);

if (activeIndex === -1 || overIndex === -1) return; // extra safety check


    if (activeSemester === overSemester) {
      dispatch(
        moveModuleWithinSemester({
          semester: activeSemester,
          oldIndex: activeIndex,
          newIndex: overIndex,
        })
      );
    } else {
      dispatch(
        moveModuleToAnotherSemester({
          fromSemester: activeSemester,
          toSemester: overSemester,
          oldIndex: activeIndex,
          newIndex: overIndex,
        })
      );
    }
  };

  return (
    <Box padding={2}>
      <Typography variant="h4" gutterBottom>Timetable</Typography>
      <DndContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {semesterLabels.map((label, index) => {
            const semesterIndex: string = (index + 1).toString();
            const moduleIds: string[] = semesters[semesterIndex] || [];
            const semesterModules = moduleIds
              .map((id: string) => modules[id])
              .filter(Boolean);

            return (
              <Grid key={index}>
                <Semester
                  semesterIndex={Number(semesterIndex)}
                  label={label}
                  modules={semesterModules}
                />
              </Grid>
            );
          })}
        </Grid>
      </DndContext>
    </Box>
  );
};

export default Timetable;
