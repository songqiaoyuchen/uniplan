"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ModuleCard from "./ModuleCard";
import { ModuleData } from "@/types/plannerTypes";
import Box from "@mui/material/Box";
import { closeSidebar, openSidebar } from "@/store/sidebarSlice";
import { useDispatch, useSelector } from "react-redux";
import { setActiveModule } from "@/store/plannerSlice";
import { RootState } from "@/store";
import { memo } from "react";

interface PlannerModuleProps {
  module: ModuleData;
}

const PlannerModule: React.FC<PlannerModuleProps> = ({ module }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: module.code,
    data: {
      type: "module",
      module,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    margin: 0,
  };

  const dispatch = useDispatch();
  const isSelected = useSelector(
    (state: RootState) => state.planner.activeModuleCode === module.code,
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      dispatch(closeSidebar());
      dispatch(setActiveModule(null));
    } else {
      dispatch(setActiveModule(module.code));
      dispatch(openSidebar());
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      {...attributes}
      {...listeners}
      sx={{
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <ModuleCard module={module} />
    </Box>
  );
};

export default memo(PlannerModule);
