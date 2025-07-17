"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { toggleSidebar } from "@/store/sidebarSlice";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import ModuleDetails from "./ModuleDetails";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ModuleSearch from "./ModuleSearch";
import { useModuleState } from "../../hooks";
import { selectSelectedModuleCode } from "@/store/timetableSelectors";
import { memo } from "react";
import { MOBILE_DRAWER_HEIGHT, SIDEBAR_WIDTH } from "@/constants";

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.sidebar.isOpen);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleToggle = () => dispatch(toggleSidebar());

  const selectedModuleCode = useAppSelector(selectSelectedModuleCode);
  const { module, isPlanned } = useModuleState(selectedModuleCode);

  return isMobile ? (
    <Box
      sx={{
        position: "fixed",
        bottom: isOpen ? 0 : -MOBILE_DRAWER_HEIGHT,
        left: 0,
        right: 0,
        height: MOBILE_DRAWER_HEIGHT,
        backgroundColor: "background.default",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        boxShadow: 4,
        overflowY: "auto",
        transition: "bottom 0.3s",
        zIndex: 1200,
      }}
    >
      <IconButton
        onClick={handleToggle}
        size="small"
        sx={{ position: "absolute", top: 8, right: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <Box sx={{ p: 2, gap: 2 }}>
        {isOpen && <ModuleSearch />}
        {module && isOpen && <ModuleDetails module={module} isPlanned={isPlanned} />}
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        position: "fixed",
        top: "64px",
        bottom: 0,
        left: 0,
        width: SIDEBAR_WIDTH,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        backgroundColor: "background.default",
        borderRight: "solid 1px",
        borderColor: "divider",
        transform: isOpen
          ? "translateX(0)"
          : `translateX(-${SIDEBAR_WIDTH - 38}px)`,
        transition: "transform 0.3s",
      }}
    >
      <IconButton
        onClick={handleToggle}
        size="small"
        sx={{
          position: "absolute",
          top: 16,
          right: -18,
          zIndex: 1500,
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
      >
        {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </IconButton>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          alignItems: "flex-start",
          p: "26px",
          gap: 2,
          width: "100%",
          overflowY: "auto",
          // hide scrollbar unless on hover
          scrollbarColor: "transparent transparent",
          "&:hover": {
            scrollbarColor: "rgba(62, 62, 62, 1) transparent",
          },
        }}
      >
        {isOpen && <ModuleSearch />}
        {module && isOpen && selectedModuleCode && <ModuleDetails module={module} isPlanned={isPlanned} />}
      </Box>
    </Box>
  );
};

export default memo(Sidebar);
