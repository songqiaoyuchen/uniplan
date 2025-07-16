import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '.'
import { moduleAdded, moduleMoved, moduleSelected, moduleUnselected, updateModuleStates } from './timetableSlice'
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
          api.dispatch(apiSlice.endpoints.getModuleByCode.initiate(code))
        )
      );
      // Now all static data should be in cache, so check issues
      api.dispatch(updateModuleStates());
    },
  });
};

addTimetableListeners(startAppListening)