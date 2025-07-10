import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import themeReducer from "./themeSlice";
import timetableReducer from "./timetableSlice"; 
import sidebarReducer from "./sidebarSlice";
import plannerReducer from "./plannerSlice";
import { apiSlice } from "./apiSlice";

const persistConfig = {
  key: "root",
  storage,
  blacklist: [apiSlice.reducerPath], 
};

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  timetable: timetableReducer,
  theme: themeReducer,
  sidebar: sidebarReducer,
  planner: plannerReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    })
    .concat(apiSlice.middleware), 
});

export const persistor = persistStore(store);

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];