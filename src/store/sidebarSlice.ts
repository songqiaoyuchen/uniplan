// store/sidebarSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";

interface SidebarState {
  isOpen: boolean;
  activeTab: number; // 0 = Details, 1 = Generate
}

const initialState: SidebarState = {
  isOpen: false,
  activeTab: 0,
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
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { toggleSidebar, openSidebar, closeSidebar, setActiveTab } =
  sidebarSlice.actions;
export default sidebarSlice.reducer;

// --- selectors ---
export const selectIsSidebarOpen = (state: RootState) => state.sidebar.isOpen;
export const selectActiveTab = (state: RootState) => state.sidebar.activeTab;