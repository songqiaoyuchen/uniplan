"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
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
import { useCallback } from "react";

// Import your types and actions
import { RootState } from "@/store";
import { addModule, moveModule, reorderModules, updateModules } from "@/store/plannerSlice";
import { ModuleData } from "@/types/plannerTypes";
import { checkConflicts } from "@/utils/planner/checkConflicts";
import { fetchModule } from "@/services/planner/fetchModule";

import PlannerModule from "./timetable/PlannerModule";
import MinModuleCard from "./sidebar/MinModuleCard";
import Sidebar from "./sidebar";
import Box from "@mui/material/Box";
import Timetable from "./timetable";

const PlannerContainer: React.FC = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  
  const dispatch = useDispatch();

  const modules = useSelector((state: RootState) => state.planner.modules);
  const fetchedModules = useSelector((state: RootState) => state.planner.fetchedModules);

  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [overSemesterId, setOverSemesterId] = useState<string | null>(null);

  const activeModule = activeCode ? modules[activeCode] : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveCode(event.active.id.toString().split("-")[0].trim());
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverSemesterId(null);
      return;
    }
    const overType = over.data.current?.type;
    let semesterId: string | null = null;
    if (overType === "semester") {
      semesterId = over.id.toString();
    } else if (overType === "module") {
      const moduleSemesterId = over.data.current?.module?.plannedSemester?.toString();
      if (moduleSemesterId !== undefined) {
        semesterId = moduleSemesterId;
      }
    }
    setOverSemesterId(semesterId);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const cleanup = () => {
      setActiveCode(null);
      setOverSemesterId(null);
    };

    if (!over) return cleanup();

    const rawId = active.id.toString().split("-")[0].trim();
    const currentData = active.data.current;
    const moduleCode =
      currentData?.module?.code || currentData?.moduleCode || rawId;
    const isNew = currentData?.isNew;

    const toSemester =
      over.data.current?.type === "semester"
        ? Number(over.id)
        : over.data.current?.module?.plannedSemester;

    if (toSemester === null || toSemester === undefined) return cleanup();

    let module: ModuleData | undefined = currentData?.module;

    if (!module) {
      module = modules[moduleCode] || fetchedModules[moduleCode];
      if (!module) {
        try {
          const fetched = await fetchModule(moduleCode);
          module = { ...fetched, plannedSemester: toSemester };
        } catch (err) {
          console.error(`Failed to fetch module ${moduleCode}`, err);
          return cleanup();
        }
      }
    }

    const fromSemester = module.plannedSemester;

    if (isNew && !modules[moduleCode]) {
      dispatch(addModule({ ...module, plannedSemester: toSemester }));
    }

    if (fromSemester === toSemester && fromSemester !== null) {
      if (active.id !== over.id) {
        dispatch(
          reorderModules({
            semesterIndex: fromSemester,
            activeCode: active.id.toString(),
            overCode: over.id.toString(),
          }),
        );
      }
    } else {
      dispatch(
        moveModule({
          moduleCode,
          fromSemester: fromSemester ?? null,
          toSemester,
        }),
      );
    }
    
    const newModules = {
      ...modules,
      [moduleCode]: {
        ...module,
        plannedSemester: toSemester,
      },
    };
    dispatch(updateModules(checkConflicts(newModules)));
    cleanup();
  }, [dispatch, modules, fetchedModules]);

  return (
    <Box sx={{ display: "flex", flexDirection: "row" }}>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        collisionDetection={rectIntersection}
      >
        <Sidebar />

        {/* timetable */}
        <Timetable overSemesterId={overSemesterId} />

        {/* overlay modulecard */}
        {createPortal(
          <DragOverlay>
            {activeModule ? (
              <PlannerModule module={activeModule} />
            ) : activeCode ? (
              <MinModuleCard moduleCode={activeCode} />
            ) : null}
          </DragOverlay>,

          document.body,
        )}
      </DndContext>
    </Box>
  );
};

export default PlannerContainer;