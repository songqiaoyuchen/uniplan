"use client";

import { useState } from "react";
import { useCallback } from "react";
import { createPortal } from "react-dom";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  rectIntersection,
} from "@dnd-kit/core";

import Sidebar from "./sidebar";
import Box from "@mui/material/Box";
import Timetable from "./timetable";
import ModuleCard from "./timetable/ModuleCard";
import { useAppDispatch } from "@/store";
import { moduleAdded, moduleMoved, moduleRemoved, moduleReordered, semesterDraggedOverCleared, semesterDraggedOverSet } from "@/store/timetableSlice";
import { useModuleState } from "../hooks";
import DeleteZone from "./DeleteZone";

const PlannerContainer: React.FC = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // drag overlay states
  const [draggingModuleCode, setDraggingModuleCode] = useState<string | null>(null);
  const { module: draggingModule } = useModuleState(draggingModuleCode)

  const dispatch = useAppDispatch();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingModuleCode(event.active.id.toString().split('-')[0]);
  }, []);

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    let targetSemesterId: number | null = null;

    if (over) {
      const overData = over.data.current;
      if (overData?.semesterId !== undefined) {
        targetSemesterId = overData.semesterId;
      }
    }

    if (targetSemesterId !== null) {
      dispatch(semesterDraggedOverSet(targetSemesterId));
    }
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setDraggingModuleCode(null);
    dispatch(semesterDraggedOverCleared());

    if (!over || active.id === over.id) return;

    const [draggingModuleCode, source] = (active.id as string).split('-');

    if (over?.id === "delete-zone") {
      dispatch(moduleRemoved({ moduleCode: draggingModuleCode }));
      return;
    }

    const sourceSemesterId = active.data.current?.semesterId;
    const destSemesterId = over.data.current?.semesterId;

    // Sidebar drop
    if (source === "sidebar") {
      if (typeof destSemesterId !== "number") return;
      dispatch(moduleAdded({ moduleCode: draggingModuleCode, destSemesterId }));
      return;
    }

    // Drop must be over a semester
    if (typeof sourceSemesterId !== "number" || typeof destSemesterId !== "number") return;

    const overModuleCode =
      over.data.current?.type === "module"
        ? (over.id as string).split("-")[0]
        : null;

    if (sourceSemesterId === destSemesterId) {
      dispatch(
        moduleReordered({
          semesterId: sourceSemesterId,
          activeModuleCode: draggingModuleCode,
          overModuleCode,
        })
      );
    } else {
      dispatch(
        moduleMoved({
          activeModuleCode: draggingModuleCode,
          overModuleCode,
          sourceSemesterId,
          destSemesterId,
        })
      );
    }
  }, [dispatch]);


  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <Sidebar />  
        <Timetable />

        {/* overlay modulecard */}
        {createPortal(
          <DragOverlay>
            {draggingModuleCode && draggingModule && (
              <ModuleCard module={draggingModule} />
            )}
          </DragOverlay>,
          document.body,
        )}

        {draggingModuleCode &&
          createPortal(<DeleteZone />, document.body)
        }

      </DndContext>
    </Box>
  );
};

export default PlannerContainer;
