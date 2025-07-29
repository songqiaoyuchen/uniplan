import { createSelector } from "reselect";
import { RootState } from ".";
import { modulesAdapter, semestersAdapter } from "./timetableSlice";

// --- selectors ---
export const {
  selectIds: selectSemesterIds,
  selectById: selectSemesterById,
} = semestersAdapter.getSelectors((s: RootState) => s.timetable.semesters);

export const {
  selectById: selectModuleByCode,
} = modulesAdapter.getSelectors((s: RootState) => s.timetable.modules);

export const selectSelectedModuleCode = (state: RootState) => state.timetable.selectedModuleCode;
export const selectDraggedOverSemesterId = (state: RootState) => state.timetable.draggedOverSemesterId;
export const selectIsMinimalView = (state: RootState) => state.timetable.isMinimalView;

// --- memoized selectors / selector factories ---
export const makeSelectModuleCodesBySemesterId = (semesterId: number) =>
  createSelector(
    (state: RootState) => state.timetable.semesters.entities[semesterId]?.moduleCodes ?? [],
    (moduleCodes) => [...moduleCodes]
  );

export const makeIsModuleSelectedSelector = (moduleCode: string) =>
  createSelector([selectSelectedModuleCode], (selectedCode) => selectedCode === moduleCode);

export const makeIsSemesterDraggedOverSelector = (semesterId: number) =>
  createSelector([selectDraggedOverSemesterId], (draggedOverSemesterId) => draggedOverSemesterId === semesterId);

export const makeIsModulePlannedSelector = (moduleCode: string) =>
  createSelector(
    (state: RootState) => state.timetable.semesters.entities,
    (semesters) =>
      Object.values(semesters).some((semester) =>
        semester?.moduleCodes.includes(moduleCode)
      )
  );

export const makeSelectModuleStateByCode = (moduleCode: string) =>
  createSelector(
    [(state: RootState) => state.timetable.modules.entities[moduleCode]],
    (moduleState) =>
      moduleState ? { ...moduleState } : null
  );

export const makeSelectSemesterHeaderInfo = () =>
  createSelector(
    [
      (state: RootState) => state.timetable.semesters.entities,
      (state: RootState) => state.timetable.modules.entities,
      (_state: RootState, semesterId: number) => semesterId
    ],
    (semesters, modules, semesterId) => {
      const semester = semesters[semesterId];
      if (!semester) {
        console.error(`Semester ${semesterId} not found`);
        return { moduleCount: 0, totalMCs: 0 };
      }
      
      const moduleCount = semester.moduleCodes.length;
      const totalMCs = semester.moduleCodes.reduce(
        (acc, moduleCode) => acc + (modules[moduleCode]?.credits ?? 0),
        0
      );
      
      return { moduleCount, totalMCs };
    }
  );