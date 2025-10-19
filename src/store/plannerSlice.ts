import { createSlice, createEntityAdapter, PayloadAction, EntityState, createAsyncThunk } from "@reduxjs/toolkit";
import { timetableLoaded, type Semester } from "./timetableSlice";
import { ModuleData } from "@/types/plannerTypes";
import { RootState } from ".";

export interface Timetable {
  name: string;
  modules: EntityState<ModuleData, string>;
  semesters: EntityState<Semester, number>;
}

export interface PlannerState {
  timetables: EntityState<Timetable, string>;
  activeTimetableName: string | null;
}

const timetableAdapter = createEntityAdapter({
  selectId: (t: Timetable) => t.name,
});

const emptyModules: EntityState<ModuleData, string> = { ids: [], entities: {} };
const emptySemesters: EntityState<Semester, number> = { ids: [], entities: {} };

const initialState: PlannerState = {
  timetables: timetableAdapter.getInitialState(),
  activeTimetableName: null,
};

export const plannerSlice = createSlice({
  name: "planner",
  initialState,
  reducers: {
    // Called once on app init to ensure an empty timetable exists
    plannerInitialised: (state) => {
      if (state.timetables.ids.length === 0) {
        timetableAdapter.addOne(state.timetables, {
          name: "New Timetable",
          modules: emptyModules,
          semesters: emptySemesters,
        });
        state.activeTimetableName = "New Timetable";
      }
    },

    timetableAdded: (state, action: PayloadAction<{ name: string }>) => {
      const current = state.timetables.entities[state.activeTimetableName!];
      timetableAdapter.addOne(state.timetables, {
        name: action.payload.name,
        modules: current ? current.modules : emptyModules,
        semesters: current ? current.semesters : emptySemesters,
      });
      state.activeTimetableName = action.payload.name;
    },

    timetableRemoved: (state, action: PayloadAction<string>) => {
      timetableAdapter.removeOne(state.timetables, action.payload);
      if (state.activeTimetableName === action.payload) {
        const firstId = state.timetables.ids[0] as string | undefined;
        state.activeTimetableName = firstId ?? null;
      }
    },

    timetableRenamed: (
      state,
      action: PayloadAction<{ oldName: string; newName: string }>
    ) => {
      const timetable = state.timetables.entities[action.payload.oldName];
      if (timetable) {
        timetableAdapter.removeOne(state.timetables, action.payload.oldName);
        timetableAdapter.addOne(state.timetables, {
          ...timetable,
          name: action.payload.newName,
        });
        if (state.activeTimetableName === action.payload.oldName) {
          state.activeTimetableName = action.payload.newName;
        }
      }
    },

    currentTimetableSet: (state, action: PayloadAction<string>) => {
      if (state.timetables.ids.includes(action.payload)) {
        state.activeTimetableName = action.payload;
      }
    },

    timetableUpdated: (
      state,
      action: PayloadAction<{
        name: string;
        modules?: EntityState<ModuleData, string>;
        semesters?: EntityState<Semester, number>;
      }>
    ) => {
      const { name, modules, semesters } = action.payload;
      timetableAdapter.updateOne(state.timetables, {
        id: name,
        changes: {
          ...(modules && { modules }),
          ...(semesters && { semesters }),
        },
      });
    },
  },
});

export const {
  plannerInitialised,
  timetableAdded,
  timetableRemoved,
  timetableRenamed,
  currentTimetableSet,
  timetableUpdated,
} = plannerSlice.actions;

export default plannerSlice.reducer;

export const plannerSelectors = timetableAdapter.getSelectors(
  (state: { planner: PlannerState }) => state.planner.timetables
);

export const switchTimetable = createAsyncThunk<void, string, { state: RootState }>(
  'planner/switchTimetable',
  async (nextName, { getState, dispatch }) => {
    const state = getState()
    const current = state.planner.activeTimetableName

    // Save the current working timetable (if one exists)
    if (current) {
      dispatch(
        timetableUpdated({
          name: current,
          modules: state.timetable.modules,
          semesters: state.timetable.semesters,
        })
      )
    }

    // Switch the active timetable
    dispatch(currentTimetableSet(nextName))

    // Load the newly selected timetable into the working slice
    const next = plannerSelectors.selectById(getState(), nextName)
    if (next) {
      dispatch(
        timetableLoaded({
          modules: Object.values(next.modules.entities).filter(Boolean),
          semesters: Object.values(next.semesters.entities).filter(Boolean),
        })
      )
    }
  }
)