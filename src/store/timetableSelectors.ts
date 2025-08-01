import { createSelector } from "reselect";
import { RootState } from ".";
import { modulesAdapter, semestersAdapter } from "./timetableSlice";
import { flattenPrereqTree } from "@/utils/planner/flattenPrereqTree";

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
        console.error(`Semester ID=${semesterId} not found`);
        return { moduleCount: 0, totalCredits: 0 };
      }
      
      const moduleCount = semester.moduleCodes.length;
      const totalCredits = semester.moduleCodes.reduce(
        (acc, moduleCode) => acc + (modules[moduleCode]?.credits ?? 0),
        0
      );
      
      return { moduleCount, totalCredits };
    }
  );

export const selectTotalCredits = createSelector(
  [
    (state: RootState) => state.timetable.semesters.entities, 
    (state: RootState) => state.timetable.modules.entities
  ],
  (semesters, modules) => {
    return Object.values(semesters).reduce((total, semester) => {
      return total + semester.moduleCodes.reduce((sum, code) => {
        const mod = modules[code];
        return sum + (mod ? mod.credits : 0);
      }, 0);
    }, 0);
  }
);

export const selectLatestNormalSemester = createSelector(
  [(state: RootState) => state.timetable.semesters.entities],
  (semesters) => {
    const normalSemesters = Object.values(semesters).filter(
      (s) => s.id % 2 === 0
    );
    if (normalSemesters.length === 0) return 0;

    return normalSemesters.reduce((latest, current) =>
      current.id > latest.id ? current : latest
    ).id;
  }
);

export const makeIsModuleRelatedSelector = (code: string) =>
  createSelector(
    [
      (state: RootState) => state.timetable.selectedModuleCode,
      (state: RootState) => state.timetable.modules.entities,
    ],
    (selectedCode, modules) => {
      if (!selectedCode || code === selectedCode) return false;

      const selectedModule = modules[selectedCode];
      if (!selectedModule) return false;

      const forwardSet = flattenPrereqTree(selectedModule.requires);

      const isForward = forwardSet.has(code);
      const isReverse = Object.values(modules).some((mod) => {
        if (!mod?.requires) return false;
        const prereqs = flattenPrereqTree(mod.requires);
        return prereqs.has(selectedCode) && mod.code === code;
      });

      return isForward || isReverse;
    }
  );
