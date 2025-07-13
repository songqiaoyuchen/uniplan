import { createListenerMiddleware, addListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '.'
import { moduleAdded, moduleMoved, moduleSelected, moduleUnselected, updateStatusIssues } from './timetableSlice'
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
      api.dispatch(updateStatusIssues());
    },
  });

  startAppListening({
    actionCreator: moduleAdded,
    effect: async (_, api) => {
      api.cancelActiveListeners();
      api.dispatch(updateStatusIssues());
    },
  });

  startAppListening({
    matcher: apiSlice.endpoints.getTimetable.matchFulfilled,
    effect: async (_, api) => {
      api.cancelActiveListeners();
      api.dispatch(updateStatusIssues());
    },
  });
};

addTimetableListeners(startAppListening)