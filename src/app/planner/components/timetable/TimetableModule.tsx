"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ModuleCard from "./ModuleCard";
import Box from "@mui/material/Box";
import { memo, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { moduleSelected, moduleUnselected } from "@/store/timetableSlice";
import { useModuleState } from "../../hooks";
import { useRouter } from "next/navigation";
import MiniModuleCard from "./MiniModuleCard";

interface TimetableModuleProps {
  moduleCode: string;
  semesterId: number
}

const TimetableModule: React.FC<TimetableModuleProps> = ({ moduleCode, semesterId }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);

  const { module, isLoading, isError, isSelected } = useModuleState(moduleCode);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: moduleCode,
    data: {
      type: 'module', 
      semesterId: semesterId,
    },
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      margin: 0,
      backgroundColor: "transparent",
      opacity: isDragging ? 0.4 : 1,
    }),
    [transform, transition]
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      dispatch(moduleUnselected());
      router.push("?", { scroll: false });
    } else {
      dispatch(moduleSelected(moduleCode))
      router.push(`?module=${moduleCode}`, { scroll: false });
    }
  }, [dispatch, isSelected, moduleCode]);

  // loading presentation to be refined
  if (isLoading) {
    return <Box ref={setNodeRef} style={style}>Loading…</Box>;
  }
  if (isError || !module) {
    return <Box ref={setNodeRef} style={style}>Error loading module</Box>;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      {isMinimalView 
        ? (<MiniModuleCard module={module} isSelected={isSelected} />) 
        : (<ModuleCard module={module} isSelected={isSelected} />)}
    </div>
  );
};

export default memo(TimetableModule);

