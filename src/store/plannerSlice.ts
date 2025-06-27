// src/store/plannerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData } from '@/types/plannerTypes';
import { arrayMove } from '@dnd-kit/sortable';

type PlannerState = {
  modules: Record<string, ModuleData>; 
  semesters: string[][];
  selectedModuleId: string | null;
};

const initialState: PlannerState = {
  modules: {},
  semesters: Array.from({ length: 8 }, () => []),
  selectedModuleId: null,
};

const plannerSlice = createSlice({
  name: 'planner',
  initialState,
  reducers: {
    setModules(state, action: PayloadAction<ModuleData[]>) {
      // avoid overwriting a user's persisted state
      // if (Object.keys(state.modules).length > 0) {
      //   return;
      // }
      
      state.modules = Object.fromEntries(action.payload.map((mod) => [mod.id, mod]));
      state.semesters = Array.from({ length: 8 }, () => []); // Reset state

      action.payload.forEach((mod) => {
        if (
          mod.plannedSemester >= 0 &&
          mod.plannedSemester < state.semesters.length
        ) {
          state.semesters[mod.plannedSemester].push(mod.id);
        } else {
          console.error(
            `Module with ID ${mod.id} has an invalid plannedSemester: ${mod.plannedSemester}. 
            It must be between 1 and ${state.semesters.length}.`
          );
        }
      });
    },

    moveModule(state, action: PayloadAction<{
      moduleId: string;
      fromSemester: number | null | undefined;
      toSemester: number;
    }>) {
      const { moduleId, fromSemester, toSemester } = action.payload;

      // Remove from old semester if valid
      if (typeof fromSemester === 'number' && fromSemester >= 0 && fromSemester < state.semesters.length) {
        state.semesters[fromSemester] = state.semesters[fromSemester].filter(id => id !== moduleId);
      }

      // Add to new semester if valid
      if (toSemester >= 0 && toSemester < state.semesters.length) {
        state.semesters[toSemester].push(moduleId);
      }

      // Update module's internal state
      if (state.modules[moduleId]) {
        state.modules[moduleId].plannedSemester = toSemester;
      }
    },

    reorderModules(
      state,
      action: PayloadAction<{ semesterIndex: number; activeId: string; overId: string }>
    ) {
      const { semesterIndex, activeId, overId } = action.payload;
      const semester = state.semesters[semesterIndex];

      const oldIndex = semester.indexOf(activeId);
      const newIndex = semester.indexOf(overId);

      if (oldIndex === -1 || newIndex === -1) return;

      state.semesters[semesterIndex] = arrayMove(semester, oldIndex, newIndex);
    },

    selectModule: (state, action: PayloadAction<string | null>) => {
      state.selectedModuleId = action.payload;
    },

    addModule(state, action: PayloadAction<ModuleData>) {
      const mod = action.payload;
      if (!state.modules[mod.id]) {
        state.modules[mod.id] = mod;
      }
    },
  },
});

export const {
  setModules,
  moveModule,
  reorderModules,
  selectModule,
  addModule,
} = plannerSlice.actions;

export default plannerSlice.reducer;