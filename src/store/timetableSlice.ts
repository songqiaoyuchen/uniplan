import { createAsyncThunk, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiSlice } from "./apiSlice";
import { ModuleData } from "@/types/plannerTypes";
import { RootState } from ".";

interface TimetableState {
  semesters: {
    [semesterId: number]: {
      id: number;
      title: string;
      moduleCodes: string[]; // stores only module codes
    };
  };
  selectedModuleCode: string | null;
  dragoverSemesterId: number | null;
  activeDragModuleCode: string | null;
}

const initialState: TimetableState = {
  semesters: {
    0: { id: 0, title: 'Year 1 / Sem 1', moduleCodes: [] },
    1: { id: 1, title: 'Year 1 / Sem 2', moduleCodes: [] },
    2: { id: 2, title: 'Year 2 / Sem 1', moduleCodes: [] },
    3: { id: 3, title: 'Year 2 / Sem 2', moduleCodes: [] },
    4: { id: 4, title: 'Year 3 / Sem 1', moduleCodes: [] },
    5: { id: 5, title: 'Year 3 / Sem 2', moduleCodes: [] },
    6: { id: 6, title: 'Year 4 / Sem 1', moduleCodes: [] },
    7: { id: 7, title: 'Year 4 / Sem 2', moduleCodes: [] },
    8: { id: 8, title: 'Year 5 / Sem 1', moduleCodes: [] },
    9: { id: 9, title: 'Year 5 / Sem 2', moduleCodes: [] },
  },
  selectedModuleCode:  null,
  dragoverSemesterId:  null,
  activeDragModuleCode: null,
};

const timetableSlice = createSlice({
  name: 'timetable',
  initialState,
  reducers: {
    // Action to handle moving a module within/between semesters
    moduleMoved(state, action: PayloadAction<{ moduleCode: string; sourceSemesterId: number; destSemesterId: number; destIndex: number }>) {
      const { moduleCode, sourceSemesterId, destSemesterId, destIndex } = action.payload;
      
      // 1. Remove from source
      const sourceModuleCodes = state.semesters[sourceSemesterId]?.moduleCodes;
      const moduleIndex = sourceModuleCodes.indexOf(moduleCode);
      if (moduleIndex > -1) {
        sourceModuleCodes.splice(moduleIndex, 1);
      }

      // 2. Add to destination
      state.semesters[destSemesterId]?.moduleCodes.splice(destIndex, 0, moduleCode);
    },

    // Action to add a new module from the sidebar
    moduleAdded(state, action: PayloadAction<{ moduleCode: string; destSemesterId: number }>) {
        const { moduleCode, destSemesterId } = action.payload;
        const destSemester = state.semesters[destSemesterId];
        if (destSemester && !destSemester.moduleCodes.includes(moduleCode)) {
            destSemester.moduleCodes.push(moduleCode);
        }
    },

    // Action to set the currently selected module
    moduleSelected(state, action: PayloadAction<{ code: string | null }>) {
      state.selectedModuleCode = action.payload.code;
    },

    // Action to track which semester is being hovered over during a drag
    semesterDragoverSet(state, action: PayloadAction<{ semesterId: number | null }>) {
        state.dragoverSemesterId = action.payload.semesterId;
    },

    // action for drag
    dragStarted(state, action: PayloadAction<{ code: string }>) {
      state.activeDragModuleCode = action.payload.code;
    },
    dragEnded(state) {
      state.activeDragModuleCode = null;
      state.dragoverSemesterId = null;
    },
  },
});

export const {
    moduleMoved,
    moduleAdded,
    moduleSelected,
    semesterDragoverSet,
    dragStarted,
    dragEnded
} = timetableSlice.actions;

export default timetableSlice.reducer;

// Basic selectors
const selectTimetableState = (state: RootState) => state.timetable;
export const selectAllSemesters = (state: RootState) => state.timetable.semesters;
export const selectSelectedModuleCode = (state: RootState) => state.timetable.selectedModuleCode;
export const selectDragoverSemesterId = (state: RootState) => state.timetable.dragoverSemesterId;
export const selectActiveDragModuleCode = (state: RootState) => state.timetable.activeDragModuleCode;

/**
 * A memoized selector that returns a flat array of all module codes currently in the timetable.
 * This is efficient for checking existence.
 * e.g., `const allCodes = useAppSelector(selectAllModuleCodesInTimetable)`
 */
export const selectAllModuleCodesInTimetable = createSelector(
    [selectAllSemesters],
    (semesters) => new Set(Object.values(semesters).flatMap(sem => sem.moduleCodes))
);

/**
 * A memoized selector that takes the semesterId as an argument.
 * This is stable and will not cause re-renders if other parts of the state change.
 * e.g., `const moduleCodes = useAppSelector(state => selectModuleCodesBySemester(state, semesterId))`
 */
export const selectModuleCodesBySemester = createSelector(
  // First, pass the state and props to the input selectors
  [selectAllSemesters, (_state, semesterId: number) => semesterId],
  // Then, the projector function receives the results
  (semesters, semesterId) => semesters[semesterId]?.moduleCodes ?? []
);

/**
 * NEW: A memoized selector that returns a stable array of semester IDs.
 * This selector's result will not change unless you add/remove semesters,
 * which is a rare operation. This is key to preventing the parent `Timetable`
 * component from re-rendering.
 */
export const selectSemesterIds = createSelector(
  [selectAllSemesters],
  (semesters) => Object.keys(semesters).map(Number) // e.g., returns [0, 1, 2, 3, 4, 5]
);