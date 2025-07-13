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
export const makeSelectModuleStatusByCode = (code: string) =>
  createSelector(
    (state: RootState) => state.timetable.modules.entities[code],
    (module) => module?.status ?? null
  );