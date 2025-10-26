
import { createAsyncThunk, createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData } from "@/types/plannerTypes";
import { RootState } from '.';
import { apiSlice } from './apiSlice';
import { arrayMove } from '@dnd-kit/sortable';
import { checkModuleStates, CheckModuleStatesArgs, ModuleUpdatePayload } from '@/utils/planner/checkModuleStates';

export interface Semester {
  id: number; // e.g., 0 for Y1S1, 1 for Y1Winter, 2 for Y1S2, 3 for Y1Summer
  moduleCodes: string[]; // ordered list of module codes
}

export interface TimetableSliceState {
  modules: EntityState<ModuleData, string>;
  semesters: EntityState<Semester, number>; 
  selectedModuleCode: string | null; // for Sidebar and TimetableModule
  draggedOverSemesterId: number | null; // for TimetableSemester
  isMinimalView: boolean // for Timetable
  isVerticalView: boolean // for Timetable
  exemptedModules: string[]; // list of exempted module codes
}

export const modulesAdapter = createEntityAdapter({
  selectId: (m: ModuleData) => m.code,
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
    isMinimalView: false,
    isVerticalView: true,
    exemptedModules: [],
  } as TimetableSliceState,
  reducers: {
    timetableLoaded(
      state,
      action: PayloadAction<{
        modules: ModuleData[];
        semesters: Semester[];
      }>
    ) {
      modulesAdapter.setAll(state.modules, action.payload.modules);
      semestersAdapter.setAll(state.semesters, action.payload.semesters);
    },
    
    // handles adding a module to the timeable
    moduleAdded(
      state,
      action: PayloadAction<{ 
        module: ModuleData; 
        destSemesterId: number 
      }>
    ) {
      const { module, destSemesterId } = action.payload;

      const exists = state.modules.entities[module.code];
      if (!exists) { // defensive check
        modulesAdapter.addOne(state.modules, module);
      }

      const semester = state.semesters.entities[destSemesterId];
      if (semester && !semester.moduleCodes.includes(module.code)) { // defensive checks
        semester.moduleCodes.push(module.code);
      }
    },

    moduleCached(
      state,
      action: PayloadAction<{ 
        module: ModuleData; 
      }>
    ) {
      const { module } = action.payload;

      const exists = state.modules.entities[module.code];
      if (!exists) { // defensive check
        modulesAdapter.addOne(state.modules, module);
      }
    },

    semesterAdded: (state, action: PayloadAction<{ id: number }>) => {
      const { id } = action.payload;
      if (!state.semesters.entities[id]) {
        state.semesters.entities[id] = {
          id,
          moduleCodes: [],
        };
        state.semesters.ids.push(id);
      }
    },
    semesterRemoved: (state, action: PayloadAction<{ semesterId: number }>) => {
      const { semesterId } = action.payload;
      semestersAdapter.removeOne(state.semesters, semesterId);
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
      const termOffset = src.id % 4;
      const isSpecialTerm = termOffset === 1 || termOffset === 3;

      if (src.moduleCodes.length === 0 && isSpecialTerm) {
        // If no modules left, remove the semester
        semestersAdapter.removeOne(state.semesters, src.id);
      }

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
        semester.moduleCodes = semester.moduleCodes.filter(code => code !== moduleCode);
        const termOffset = semester.id % 4;
        const isSpecialTerm = termOffset === 1 || termOffset === 3;
        if (semester.moduleCodes.length === 0 && isSpecialTerm) {
          // If no modules left, remove the semester
          semestersAdapter.removeOne(state.semesters, semester.id);
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
    verticalViewToggled: (state) => {
      state.isVerticalView = !state.isVerticalView;
    },

    // handles exempted modules
    exemptedModuleAdded: (state, action: PayloadAction<string>) => {
      if (!state.exemptedModules.includes(action.payload)) {
        state.exemptedModules.push(action.payload);
      }
    },
    exemptedModuleRemoved: (state, action: PayloadAction<string>) => {
      state.exemptedModules = state.exemptedModules.filter(code => code !== action.payload);
    },
    exemptedModulesCleared: (state) => {
      state.exemptedModules = [];
    },
  },
  extraReducers: (builder) => {
    // update status when modules moved / added
    builder.addCase(updateModuleStates.fulfilled, (state, action) => {
      modulesAdapter.updateMany(state.modules, action.payload);
    });
    builder.addMatcher(
      apiSlice.endpoints.getTimetable.matchFulfilled,
      (state, action) => {
        semestersAdapter.setAll(state.semesters, action.payload.semesters);
        modulesAdapter.removeAll(state.modules); // clear stale modules
      }
    );
  }
});

export const {
  timetableLoaded,
  moduleAdded,
  moduleCached,
  semesterAdded,
  semesterRemoved,
  moduleMoved,
  moduleReordered,
  moduleRemoved,
  moduleSelected,
  moduleUnselected,
  semesterDraggedOverSet,
  semesterDraggedOverCleared,
  minimalViewToggled,
  verticalViewToggled,
  exemptedModuleAdded,
  exemptedModuleRemoved,
  exemptedModulesCleared
} = timetableSlice.actions;

export default timetableSlice.reducer;
export const timetableActions = timetableSlice.actions;


// --- async thunks ---
export const updateModuleStates = createAsyncThunk<
  ModuleUpdatePayload[],
  void,                  
  { state: RootState }   
>(
  'timetable/updateModuleStates',
  async (_, { getState }) => {
    const state = getState();
    
    const { semesters: semesterEntities, modules: moduleEntities } = state.timetable;

    const args: CheckModuleStatesArgs = {
      semesterEntities: semesterEntities.entities,
      moduleEntities: moduleEntities.entities,
    };

    const deltas = checkModuleStates(args);

    return deltas;
  }
);
