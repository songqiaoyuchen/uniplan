
import { createAsyncThunk, createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ModuleIssue, ModuleStatus } from "@/types/plannerTypes";
import { RootState } from '.';
import { apiSlice } from './apiSlice';
import { arrayMove } from '@dnd-kit/sortable';
import { checkIssues, CheckIssuesArgs, CheckIssuesReturn, StaticModuleDataForCheck } from '@/utils/planner/checkIssues';

export interface ModuleState {
  code: string; // code as id
  status: ModuleStatus;
  issues: ModuleIssue[];
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

export const modulesAdapter = createEntityAdapter({
  selectId: (m: ModuleState) => m.code,
});

export const semestersAdapter = createEntityAdapter({
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
          status: ModuleStatus.Planned,
          issues: []
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
    builder.addCase(updateStatusIssues.fulfilled, (state, action) => {
      modulesAdapter.updateMany(state.modules, action.payload);
    });
    // populates states when timetable fetched
    builder.addMatcher(
      apiSlice.endpoints.getTimetable.matchFulfilled,
      (state, action) => {
        const { semesters } = action.payload;

        const uniqueModuleCodes = [
          ...new Set(semesters.flatMap((s) => s.moduleCodes)),
        ];

        const modules: ModuleState[] = uniqueModuleCodes.map((code) => ({
          code,
          status: ModuleStatus.Planned,
          issues: []
        }));

        modulesAdapter.setAll(state.modules, modules);
        semestersAdapter.setAll(state.semesters, semesters);
      }
    );
  }
});

export const {
  moduleAdded,
  moduleMoved,
  moduleSelected,
  moduleUnselected,
  semesterDraggedOverSet,
  semesterDraggedOverCleared
} = timetableSlice.actions;
export default timetableSlice.reducer;

// --- async thunks ---
export const updateStatusIssues = createAsyncThunk<
  CheckIssuesReturn, // The type of the value returned by the payload creator
  void,              // The type of the thunk argument (none needed)
  { state: RootState } // Types for the thunkAPI
>(
  'timetable/updateStatusIssues',
  async (_, { getState }) => {
    const state = getState();

    // --- 1. GATHER INPUTS for checkIssues ---
    
    // a) Get dynamic state from the timetable slice
    const { semesters: semesterEntities, modules: moduleEntities } = state.timetable;
    const plannedModuleCodes = moduleEntities.ids as string[];

    // b) Get static data from the RTK Query cache.
    // We assume that when a module is added to the plan, its data has already been
    // fetched and is available in the cache. This is a common and efficient pattern.
    const staticModulesData: Record<string, StaticModuleDataForCheck> = {};
    for (const code of plannedModuleCodes) {
      const cachedModuleResult = apiSlice.endpoints.getModuleByCode.select(code)(state);

      if (cachedModuleResult.data) {
        // We only add modules that have their static data loaded
        staticModulesData[code] = cachedModuleResult.data;
      }
      // Note: You could add logging here for cases where data might be missing
    }

    // c) Assemble the arguments object for our pure function
    const args: CheckIssuesArgs = {
      staticModulesData,
      semesterEntities: semesterEntities.entities,
      moduleEntities: moduleEntities.entities,
    };

    // --- 2. EXECUTE THE CHECK & RETURN THE DELTA ---
    const deltas = checkIssues(args);
    return deltas;
  }
);
