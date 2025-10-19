
import { createAsyncThunk, createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { Grade, ModuleIssue, ModuleStatus } from "@/types/plannerTypes";
import { RootState } from '.';
import { apiSlice } from './apiSlice';
import { arrayMove } from '@dnd-kit/sortable';
import { checkModuleStates, CheckModuleStatesArgs, ModuleUpdatePayload, StaticModuleData } from '@/utils/planner/checkModuleStates';

export interface ModuleState {
  code: string; // code as id
  status: ModuleStatus;
  issues: ModuleIssue[];
  grade?: Grade;
  tags?: string[]
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
  isMinimalView: boolean // for Timetable
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
    draggedOverSemesterId: null,
    isMinimalView: false
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
          status: ModuleStatus.Satisfied,
          issues: []
        });
      }

      const semester = state.semesters.entities[destSemesterId];
      if (semester && !semester.moduleCodes.includes(moduleCode)) { // defensive checks
        semester.moduleCodes.push(moduleCode);
      }
    },

    // for intra-semester reordering only
    moduleReordered(
      state,
      action: PayloadAction<{
        semesterId: number;
        activeModuleCode: string;
        overModuleCode: string | null;
      }>
    ) {
      const { semesterId, activeModuleCode, overModuleCode } = action.payload;
      const sem = state.semesters.entities[semesterId];
      if (!sem) return;

      const oldIndex = sem.moduleCodes.indexOf(activeModuleCode);
      const newIndex = overModuleCode
        ? sem.moduleCodes.indexOf(overModuleCode)
        : sem.moduleCodes.length;

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      sem.moduleCodes = arrayMove(sem.moduleCodes, oldIndex, newIndex);
    },

    // for inter-semester moves only
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

      if (sourceSemesterId === destSemesterId) return; // handled by moduleReordered

      const src = state.semesters.entities[sourceSemesterId];
      const dst = state.semesters.entities[destSemesterId];
      if (!src || !dst) return;

      // prevent duplication if dropped on empty area
      if (!overModuleCode || activeModuleCode === overModuleCode) {
        const stillPlanned = dst.moduleCodes.includes(activeModuleCode);
        if (stillPlanned) return;
      }

      // remove from source
      src.moduleCodes = src.moduleCodes.filter(code => code !== activeModuleCode);

      // determine insert index in destination
      const insertIndex =
        overModuleCode && dst.moduleCodes.includes(overModuleCode)
          ? dst.moduleCodes.indexOf(overModuleCode)
          : dst.moduleCodes.length;

      dst.moduleCodes.splice(insertIndex, 0, activeModuleCode);
    },

    // for module removal
    moduleRemoved: (state, action: PayloadAction<{ moduleCode: string }>) => {
      const { moduleCode } = action.payload;

      // Remove from the modules entity
      modulesAdapter.removeOne(state.modules, moduleCode);

      // Remove the moduleCode from any semester.moduleCodes it's in
      Object.values(state.semesters.entities).forEach((semester) => {
        if (semester) {
          semester.moduleCodes = semester.moduleCodes.filter(code => code !== moduleCode);
        }
      });

      // Deselect if the removed module was selected
      if (state.selectedModuleCode === moduleCode) {
        state.selectedModuleCode = null;
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
    },

    // handles timetable view mode
    minimalViewToggled: (state) => {
      state.isMinimalView = !state.isMinimalView;
    },
  },
  extraReducers: (builder) => {
    // update status when modules moved / added
    builder.addCase(updateModuleStates.fulfilled, (state, action) => {
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
          status: ModuleStatus.Satisfied,
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
  moduleReordered,
  moduleRemoved,
  moduleSelected,
  moduleUnselected,
  semesterDraggedOverSet,
  semesterDraggedOverCleared,
  minimalViewToggled
} = timetableSlice.actions;
export default timetableSlice.reducer;

// --- async thunks ---
export const updateModuleStates = createAsyncThunk<
  ModuleUpdatePayload[],
  void,                  
  { state: RootState }   
>(
  'timetable/updateModuleStates',
  async (_, { getState }) => {
    const state = getState();
    
    // --- 1. gather inputs ---
    // a) Dynamic state from timetable slice
    const { semesters: semesterEntities, modules: moduleEntities } = state.timetable;
    const plannedModuleCodes = moduleEntities.ids as string[];

    // b) Static data from RTK Query cache
    const staticModulesData: Record<string, StaticModuleData> = {};
    for (const code of plannedModuleCodes) {
      const cached = apiSlice.endpoints.getModuleByCode.select(code)(state);
      if (cached.data) {
        staticModulesData[code] = cached.data;
      }
    }

    // c) Prepare arguments for pure state-checking function
    const args: CheckModuleStatesArgs = {
      staticModulesData,
      semesterEntities: semesterEntities.entities,
      moduleEntities: moduleEntities.entities,
    };

    // --- 2. RUN CHECK AND RETURN DELTAS ---
    const deltas = checkModuleStates(args);
    return deltas;
  }
);
