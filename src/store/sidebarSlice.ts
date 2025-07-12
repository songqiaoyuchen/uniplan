// store/sidebarSlice.ts
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from ".";

interface SidebarState {
  isOpen: boolean;
}

const initialState: SidebarState = {
  isOpen: false,
};

const sidebarSlice = createSlice({
  name: "sidebar",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    openSidebar: (state) => {
      state.isOpen = true;
    },
    closeSidebar: (state) => {
      state.isOpen = false;
    },
  },
});

export const { toggleSidebar, openSidebar, closeSidebar } =
  sidebarSlice.actions;
export default sidebarSlice.reducer;

// --- selectors ---
export const selectIsSidebarOpen = (state: RootState) => state.sidebar.isOpen;