import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '.'
import { moduleAdded, moduleMoved, moduleRemoved, moduleSelected, moduleUnselected, timetableActions, updateModuleStates } from './timetableSlice'
import { closeSidebar, openSidebar } from './sidebarSlice'
import { apiSlice } from './apiSlice'

export const listenerMiddleware = createListenerMiddleware()

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>()
export type AppStartListening = typeof startAppListening

export const addAppListener = addListener.withTypes<RootState, AppDispatch>()
export type AppAddListener = typeof addAppListener

const addTimetableListeners = (startAppListening: AppStartListening) => {
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
      api.dispatch(updateModuleStates());
    },
  });

  startAppListening({
    actionCreator: moduleAdded,
    effect: async (_, api) => {
      api.cancelActiveListeners();
      api.dispatch(updateModuleStates());
    },
  });

  startAppListening({
    actionCreator: moduleRemoved,
    effect: async (_, api) => {
      api.cancelActiveListeners();
      api.dispatch(updateModuleStates());
    },
  });

  startAppListening({
    matcher: apiSlice.endpoints.getModuleByCode.matchFulfilled,
    effect: async (action, api) => {
      const moduleData = action.payload;
      const moduleCode = moduleData.code;
      const state = api.getState() as RootState;

      // Check if this module code exists in any semester
      const isInTimetable = Object.values(state.timetable.semesters.entities).some(semester =>
        semester?.moduleCodes.includes(moduleCode)
      );

      // If it's part of the timetable, add it to the slice
      if (isInTimetable) {
        api.dispatch(timetableActions.moduleCached({
          module: moduleData,
        }));
      }
    },
  });

  startAppListening({
    matcher: apiSlice.endpoints.getTimetable.matchFulfilled,
    effect: async (action, api) => {
      api.cancelActiveListeners();
      // Extract module codes from the fetched timetable
      const semesters = action.payload.semesters;
      const uniqueModuleCodes = [
        ...new Set(semesters.flatMap((s) => s.moduleCodes)),
      ];
      // Dispatch getModuleByCode for each code and wait for all to resolve
      await Promise.all(
        uniqueModuleCodes.map((code) =>
          api.dispatch(apiSlice.endpoints.getModuleByCode.initiate(code, { forceRefetch: true }))
        )
      );
      // Now all static data should be in cache, so check issues
      api.dispatch(updateModuleStates());
    },
  });
};

addTimetableListeners(startAppListening)