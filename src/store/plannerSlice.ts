// src/store/plannerSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlannerModule } from '@/types/plannerTypes';

type PlannerState = {
  modules: Record<string, PlannerModule>;
  semesters: Record<number, string[]>; // key: semester number, value: ordered module IDs
};

const initialState: PlannerState = {
  modules: {},
  semesters: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, []])),
};

const plannerSlice = createSlice({
  name: 'planner',
  initialState,
  reducers: {
    setModules(state, action: PayloadAction<PlannerModule[]>) {
      state.modules = Object.fromEntries(action.payload.map((mod) => [mod.id, mod]));
      state.semesters = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, []]));
      action.payload.forEach((mod) => {
        if (mod.plannedSemester != null) {
          state.semesters[mod.plannedSemester].push(mod.id);
        }
      });
    },
    addModuleToSemester(state, action: PayloadAction<{ semester: number; moduleId: string }>) {
      const { semester, moduleId } = action.payload;
      if (!state.semesters[semester]) {
        state.semesters[semester] = [];
      }
      if (!state.semesters[semester].includes(moduleId)) {
        state.semesters[semester].push(moduleId);
        state.modules[moduleId].plannedSemester = semester;
      }
    },
    removeModuleFromSemester(state, action: PayloadAction<{ semester: number; moduleId: string }>) {
      const { semester, moduleId } = action.payload;
      state.semesters[semester] = state.semesters[semester].filter((id) => id !== moduleId);
      state.modules[moduleId].plannedSemester = null;
    },
    moveModuleWithinSemester(state, action: PayloadAction<{ semester: number; oldIndex: number; newIndex: number }>) {
      const { semester, oldIndex, newIndex } = action.payload;
      const moduleList = state.semesters[semester];
      const [moved] = moduleList.splice(oldIndex, 1);
      moduleList.splice(newIndex, 0, moved);
    },
    moveModuleToAnotherSemester(state, action: PayloadAction<{ fromSemester: number; toSemester: number; oldIndex: number; newIndex: number }>) {
      const { fromSemester, toSemester, oldIndex, newIndex } = action.payload;

      const fromList = state.semesters[fromSemester];
      const toList = state.semesters[toSemester] || [];

      const [moved] = fromList.splice(oldIndex, 1);
      toList.splice(newIndex, 0, moved);

      state.semesters[toSemester] = toList;
      state.modules[moved].plannedSemester = toSemester;
    },
    clearPlanner(state) {
      Object.values(state.modules).forEach((module) => {
        module.plannedSemester = null;
      });
      state.semesters = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, []]));
    },
  },
});

export const {
  setModules,
  addModuleToSemester,
  removeModuleFromSemester,
  moveModuleWithinSemester,
  moveModuleToAnotherSemester,
  clearPlanner,
} = plannerSlice.actions;

export default plannerSlice.reducer;
