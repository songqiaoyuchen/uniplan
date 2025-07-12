
import { createAsyncThunk, createEntityAdapter, createSelector, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData, ModuleStatus } from "@/types/plannerTypes";
import { RootState } from '.';
import { AppStartListening } from './listenerMiddleware'
import { closeSidebar, openSidebar } from './sidebarSlice';
import { apiSlice } from './apiSlice';
import { arrayMove } from '@dnd-kit/sortable';
import { checkConflicts } from '@/utils/planner/checkConflicts';

export interface ModuleState {
  code: string; // code as id
  status: ModuleStatus;
}

export interface Semester {
  id: number; // e.g., 0 for Y1S1, 1 for Y1Winter, 2 for Y1S2, 3 for Y1Summer
  moduleCodes: string[]; // ordered list of module codes
}

export interface TimetableSliceState {
  modules: EntityState<ModuleState, string>;
  semesters: EntityState<Semester, number>; 
  selectedModuleCode: string | null; // for Sidebar and TimetableModule
  draggedOverSemesterId: number | null; // for TimetableSemester
}

const modulesAdapter = createEntityAdapter({
  selectId: (m: ModuleState) => m.code,
});

const semestersAdapter = createEntityAdapter({
  selectId: (s: Semester) => s.id,
});

const timetableSlice = createSlice({
  name: 'timetable',
  initialState: {
    modules: modulesAdapter.getInitialState(),
    semesters: semestersAdapter.getInitialState(),
    selectedModuleCode: null,
  } as TimetableSliceState,
  reducers: {
    // handles initialisation of timetable
    modulesSet(state, action: PayloadAction<ModuleState[]>) {
      modulesAdapter.setAll(state.modules, action.payload);
    },
    semestersSet(state, action: PayloadAction<Semester[]>) {
      semestersAdapter.setAll(state.semesters, action.payload);
    },
    
    // handles adding a module to the timeable
    moduleAdded(
      state,
      action: PayloadAction<{ 
        moduleCode: string; 
        destSemesterId: number 
      }>
    ) {
      const { moduleCode, destSemesterId } = action.payload;

      const exists = state.modules.entities[moduleCode];
      if (!exists) { // defensive check
        modulesAdapter.addOne(state.modules, {
          code: moduleCode,
          status: ModuleStatus.Unlocked,
        });
      }

      const semester = state.semesters.entities[destSemesterId];
      if (semester && !semester.moduleCodes.includes(moduleCode)) { // defensive checks
        semester.moduleCodes.push(moduleCode);
      }
    },

    // handles module movement within timetable
    moduleMoved(
      state,
      action: PayloadAction<{
        activeModuleCode: string;
        overModuleCode: string | null;
        sourceSemesterId: number;
        destSemesterId: number;
      }>
    ) {
      const {
        activeModuleCode,
        overModuleCode,
        sourceSemesterId,
        destSemesterId,
      } = action.payload;

      const src = state.semesters.entities[sourceSemesterId];
      const dst = state.semesters.entities[destSemesterId];

      if (!src || !dst) return;

      const isSameSemester = sourceSemesterId === destSemesterId;

      if (isSameSemester) {
        const oldIndex = src.moduleCodes.indexOf(activeModuleCode);
        const newIndex = overModuleCode
          ? src.moduleCodes.indexOf(overModuleCode)
          : src.moduleCodes.length;

        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        src.moduleCodes = arrayMove(src.moduleCodes, oldIndex, newIndex);
      } else {
        if (!overModuleCode || activeModuleCode === overModuleCode) {
          const stillPlanned = dst.moduleCodes.includes(activeModuleCode);
          if (stillPlanned) return; // avoid duplication
        }

        // remove from source
        src.moduleCodes = src.moduleCodes.filter(code => code !== activeModuleCode);

        // dtermine insert index
        const insertIndex = overModuleCode && dst.moduleCodes.includes(overModuleCode)
          ? dst.moduleCodes.indexOf(overModuleCode)
          : dst.moduleCodes.length;
        // insert to destination
        dst.moduleCodes.splice(insertIndex, 0, activeModuleCode);
      }
    },

    // handles activeModuleCode
    moduleSelected(state, action: PayloadAction<string>) {
      state.selectedModuleCode = action.payload;
    },
    moduleUnselected(state) {
      state.selectedModuleCode = null;
    },

    // handles dragOverSemesterId
    semesterDraggedOverSet(state, action: PayloadAction<number>) {
      state.draggedOverSemesterId = action.payload
    },
    semesterDraggedOverCleared(state) {
      state.draggedOverSemesterId = null
    }
  },
  extraReducers: (builder) => {
    // update status when modules moved / added
    builder.addCase(updateConflicts.fulfilled, (state, action) => {
      modulesAdapter.updateMany(state.modules, action.payload);
    });
    // populates states when timetable fetched
    builder.addMatcher(
      apiSlice.endpoints.getTimetable.matchFulfilled,
      (state, action) => {
        const { semesters, modules } = action.payload;

        semestersAdapter.setAll(state.semesters, semesters);
        const typedModules: ModuleState[] = modules.map((m) => ({
          code: m.code,
          status: m.status as unknown as ModuleStatus, 
        }));
        modulesAdapter.setAll(state.modules, typedModules);
      }
    );
  }
});

export const {
  modulesSet,
  semestersSet,
  moduleAdded,
  moduleMoved,
  moduleSelected,
  moduleUnselected,
  semesterDraggedOverSet,
  semesterDraggedOverCleared
} = timetableSlice.actions;
export default timetableSlice.reducer;

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
    (moduleCodes) => moduleCodes
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

// --- async thunks ---
export const updateConflicts = createAsyncThunk(
  'timetable/updateConflicts',
  async (_, { getState }) => {
    const state = getState() as RootState;

    // 1. ASSEMBLE THE DATA
    const { semesters, modules: statefulModules } = state.timetable;
    const allModuleCodesOnBoard = statefulModules.ids as string[];
    
    const modulesToTest: Record<string, ModuleData> = {};

    for (const code of allModuleCodesOnBoard) {
      const staticData = apiSlice.endpoints.getModuleByCode.select(code)(state)?.data;
      const dynamicData = statefulModules.entities[code];

      // Find the module's current planned semester
      let plannedSemester: number | null = null;
      for (const sem of Object.values(semesters.entities)) {
        if (sem.moduleCodes.includes(code)) {
          plannedSemester = sem.id;
          break;
        }
      }

      if (staticData && dynamicData) {
        modulesToTest[code] = {
          ...staticData,
          status: dynamicData.status,
          plannedSemester: plannedSemester,
        };
      }
    }

    // 2. CALL THE UTILITY FUNCTION
    const conflictedModulesResult = checkConflicts(modulesToTest);

    // 3. DETERMINE THE CHANGES
    const updates: { id: string; changes: { status: ModuleStatus } }[] = [];
    for (const code of allModuleCodesOnBoard) {
      const originalStatus = modulesToTest[code]?.status;
      const newStatus = conflictedModulesResult[code]?.status;
      if (newStatus && newStatus !== originalStatus) {
        updates.push({ id: code, changes: { status: newStatus } });
      }
    }
    return updates;
  }
);

// --- listening middleware ---
export const addTimetableListeners = (startAppListening: AppStartListening) => {
  // Open sidebar on module selected
  startAppListening({
    actionCreator: moduleSelected,
    effect: async (_, api) => {
      api.dispatch(openSidebar());
    },
  });

  // Close sidebar on module unselected
  startAppListening({
    actionCreator: moduleUnselected,
    effect: async (_, api) => {
      api.dispatch(closeSidebar());
    },
  });

  startAppListening({
    actionCreator: moduleMoved,
    effect: async (_, api) => {
      api.cancelActiveListeners();
      api.dispatch(updateConflicts());
    },
  });

  startAppListening({
  actionCreator: moduleAdded,
  effect: async (_, api) => {
    api.cancelActiveListeners();
    api.dispatch(updateConflicts());
  },
});
};