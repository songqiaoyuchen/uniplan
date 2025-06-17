// src/store/plannerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData } from '@/types/plannerTypes';

type PlannerState = {
  modules: Record<string, ModuleData>; 
  semesters: string[][];
};

const initialState: PlannerState = {
  modules: {},
  semesters: Array.from({ length: 8 }, () => []),
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
      from: { semester: number; index: number };
      to: { semester: number; index: number };
      moduleId: string;
    }>) {
      const { from, to } = action.payload;
      const fromList = state.semesters[from.semester];
      const toList = state.semesters[to.semester];
      
      // --- Remove module from the source list ---
      const [movedModuleId] = fromList.splice(from.index, 1);

      // --- Add module to the destination list ---
      toList.splice(to.index, 0, movedModuleId);
      
      // --- If it's a new semester, update the module's internal state ---
      if (from.semester !== to.semester) {
        state.modules[movedModuleId].plannedSemester = to.semester;
      }
    },
  },
});

export const {
  setModules,
  moveModule,
} = plannerSlice.actions;

export default plannerSlice.reducer;