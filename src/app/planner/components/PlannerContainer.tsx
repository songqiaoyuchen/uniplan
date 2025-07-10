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

    if (overType === 'semester') {
      setOverSemesterId(over.id.toString());
    } else if (overType === 'module') {
      const moduleSemesterId = over.data.current?.module?.plannedSemester?.toString();
      if (moduleSemesterId !== undefined && moduleSemesterId !== null) {
        setOverSemesterId(moduleSemesterId);
      }
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveCode(null);
      setOverSemesterId(null);
      return;
    }

    const moduleCode = active.id.toString().split('-')[0].trim();
    const module = active.data.current?.module ?? await fetchModule(active.data.current?.moduleCode);
    const isNew = active.data.current?.isNew;

    const toSemester = over.data.current?.type === 'semester'
      ? Number(over.id)
      : over.data.current?.module?.plannedSemester;

    let modulesChanged = false;
    let nextModules = { ...modules };

    if (isNew && !modules[moduleCode]) {
      dispatch(addModule(module));
      nextModules[moduleCode] = module;
    }

    const fromSemester = module.plannedSemester;
    if (fromSemester === toSemester && fromSemester !== null) {
      if (active.id !== over.id) {
        dispatch(reorderModules({
          semesterIndex: fromSemester,
          activeCode: active.id.toString(),
          overCode: over.id.toString(),
        }));
      }
    } else {
      dispatch(moveModule({
        moduleCode,
        fromSemester: module.plannedSemester,
        toSemester,
      }));
      nextModules[moduleCode] = {
        ...nextModules[moduleCode],
        plannedSemester: toSemester,
      };
      modulesChanged = true;
    }

    if (modulesChanged) {
      const updatedModules = checkConflicts(nextModules);
      dispatch(updateModules(updatedModules));
    }

    setActiveCode(null);
    setOverSemesterId(null);
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