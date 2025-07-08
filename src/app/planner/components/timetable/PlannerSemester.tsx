"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import PlannerModule from "./PlannerModule";
import { memo } from "react";
import { shallowEqual } from "react-redux";
import { selectSemesterModules } from "@/store/plannerSlice";
import { ModuleData } from "@/types/plannerTypes";

interface PlannerSemesterProps {
  semesterIndex: number;
  isActive: boolean;
}

const PlannerSemester: React.FC<PlannerSemesterProps> = ({
  semesterIndex,
  isActive,
}) => {
  console.log("Rendering Semester...");

  const modules = useSelector(
    (state: RootState) => selectSemesterModules(state, semesterIndex),
    shallowEqual,
  ) as ModuleData[];

  const { setNodeRef } = useDroppable({
    id: semesterIndex,
    data: { type: "semester" },
  });

  return (
    <Box
      sx={{
        minWidth: { xs: "200px", md: "240px" },
        display: "flex",
        flexDirection: "column",
        border: "2px solid",
        borderColor: isActive ? "primary.main" : "transparent",
        borderRadius: 1.5,
        padding: "2px",
        transition: "border 0.2s ease",
        userSelect: "none",
      }}
    >
      <Stack
        ref={setNodeRef}
        spacing={1}
        direction={"column"}
        sx={{
          p: 1,
          gap: 1,
          height: "100%",
        }}
      >
        <SortableContext items={modules.map((mod) => mod.code)}>
          {modules.map((mod: ModuleData) => (
            <PlannerModule key={mod.code} module={mod} />
          ))}
        </SortableContext>
      </Stack>
    </Box>
  );
};

export default memo(PlannerSemester);
