// src/store/plannerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModuleData } from '@/types/plannerTypes';
import { arrayMove } from '@dnd-kit/sortable';

const MAX_FETCHED_MODULES = 10; 

type PlannerState = {
  modules: Record<string, ModuleData>;
  semesters: string[][];
  fetchedModules: Record<string, ModuleData>;
  fetchedOrder: string[];
  activeModuleCode: string | null;
};

const initialState: PlannerState = {
  modules: {},
  semesters: Array.from({ length: 8 }, () => []),
  fetchedModules: {},
  fetchedOrder: [],
  activeModuleCode: null,
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
      
      state.modules = Object.fromEntries(action.payload.map((mod) => [mod.code, mod]));
      state.semesters = Array.from({ length: 8 }, () => []); // Reset state

      action.payload.forEach((mod) => {
        if (
          mod.plannedSemester != null &&
          mod.plannedSemester < state.semesters.length
        ) {
          state.semesters[mod.plannedSemester].push(mod.code);
        } else {
          console.error(
            `Module with code ${mod.code} has an invalid plannedSemester: ${mod.plannedSemester}. \nIt must be between 1 and ${state.semesters.length}.`
          );
        }
      });
    },

    moveModule(state, action: PayloadAction<{
      moduleCode: string;
      fromSemester: number | null;
      toSemester: number;
    }>) {
      const { moduleCode, fromSemester, toSemester } = action.payload;

      // Remove from old semester if valid
      if (typeof fromSemester === 'number' && fromSemester >= 0 && fromSemester < state.semesters.length) {
        state.semesters[fromSemester] = state.semesters[fromSemester].filter(code => code !== moduleCode);
      }

      // Add to new semester if valid
      if (toSemester >= 0 && toSemester < state.semesters.length) {
        state.semesters[toSemester].push(moduleCode);
      }

      // Update module's internal state
      if (state.modules[moduleCode]) {
        state.modules[moduleCode].plannedSemester = toSemester;
      }
    },

    reorderModules(
      state,
      action: PayloadAction<{ semesterIndex: number; activeCode: string; overCode: string }>
    ) {
      const { semesterIndex, activeCode, overCode } = action.payload;
      const semester = state.semesters[semesterIndex];

      const oldIndex = semester.indexOf(activeCode);
      const newIndex = semester.indexOf(overCode);

      if (oldIndex === -1 || newIndex === -1) return;

      state.semesters[semesterIndex] = arrayMove(semester, oldIndex, newIndex);
    },

    setActiveModule: (state, action: PayloadAction<string | null>) => {
      state.activeModuleCode = action.payload;
    },

    addFetchedModule(state, action: PayloadAction<ModuleData>) {
      // Defensive: idk why they are undefined at times
      if (!state.fetchedModules) state.fetchedModules = {};
      if (!state.fetchedOrder) state.fetchedOrder = [];

      const mod = action.payload;
      const code = mod.code;

      if (state.modules[code] || state.fetchedModules[code]) {
        return;
      }

      state.fetchedModules[code] = mod;
      state.fetchedOrder.push(code);

      if (state.fetchedOrder.length > MAX_FETCHED_MODULES) {
        const oldestCode = state.fetchedOrder.shift();
        if (oldestCode) {
          delete state.fetchedModules[oldestCode];
        }
      }
    },


    addModule(state, action: PayloadAction<ModuleData>) {
      const mod = action.payload;
      if (!state.modules[mod.code]) {
        state.modules[mod.code] = mod;
      }
    },

    updateModules: (state, action: PayloadAction<Record<string, ModuleData>>) => {
      const updated = action.payload;
      // Only update modules that have changed
      Object.entries(updated).forEach(([code, mod]) => {
        const prev = state.modules[code];
        if (!prev || JSON.stringify(prev) !== JSON.stringify(mod)) {
          state.modules[code] = mod;
        }
      });
      // Update semesters only if plannedSemester has changed
      const newSemesters = Array.from({ length: 8 }, () => [] as string[]);
      // First, add modules that are still in the same semester in the same order
      state.semesters.forEach((semester, semIdx) => {
        semester.forEach((modCode) => {
          const mod = state.modules[modCode];
          if (mod && mod.plannedSemester === semIdx) {
            newSemesters[semIdx].push(modCode);
          }
        });
      });
      // Then, append any modules whose plannedSemester changed or are new
      Object.values(state.modules).forEach((mod) => {
        if (
          mod.plannedSemester != null &&
          mod.plannedSemester < newSemesters.length &&
          !newSemesters[mod.plannedSemester].includes(mod.code)
        ) {
          newSemesters[mod.plannedSemester].push(mod.code);
        }
      });
      state.semesters = newSemesters;
    },
  },
});

export const {
  setModules,
  moveModule,
  reorderModules,
  setActiveModule,
  addModule,
  addFetchedModule,
  updateModules
} = plannerSlice.actions;

export default plannerSlice.reducer;