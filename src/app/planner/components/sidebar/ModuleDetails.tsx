"use client";

import { ModuleData, ModuleStatus, SemesterLabel } from "@/types/plannerTypes";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ExpandableText from "@/components/ui/ExpandableText";
import AddIcon from "@mui/icons-material/Add";
import IconButton from "@mui/material/IconButton";
import { useDraggable } from "@dnd-kit/core";
import { useDispatch, useSelector } from "react-redux";
import { addFetchedModule, addModule } from "@/store/plannerSlice";
import { useEffect } from "react";
import { RootState } from "@/store";
import PrereqTreeView from "./PrereqTreeView";

interface ModuleDetailsProps {
  module: ModuleData;
}

const ModuleDetails: React.FC<ModuleDetailsProps> = ({ module }) => {
  const dispatch = useDispatch();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: module.code + "-sidebar",
    data: {
      type: "module",
      module,
      isNew: true,
    },
  });

  useEffect(() => {
    // Only add the module if it's not already in the planner state
    dispatch(addFetchedModule(module));
  }, [dispatch, module]);

  const isPlanned = useSelector((state: RootState) =>
    state.planner.semesters.some((sem) => sem.includes(module.code)),
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.2,
        width: "100%",
        px: 1,
        whiteSpace: "normal",
        wordBreak: "break-word",
      }}
    >
      {/* Header */}
      <Typography
        variant="h5"
        fontWeight={700}
        display="flex"
        alignItems="center"
      >
        {module.code}
        {!isPlanned && (
          <Box
            component="span"
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={{
              ml: 1,
              display: "inline-flex",
              alignItems: "center",
              cursor: "grab",
              "&:active": { cursor: "grabbing" },
            }}
          >
            <IconButton size="small" sx={{ p: 0.5 }}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Typography>

      <Typography variant="subtitle2" color="primary.extraLight">
        {module.credits} MC
      </Typography>

      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
        {module.title}
      </Typography>

      {module.faculty && (
        <Typography variant="body2" color="text.secondary">
          Faculty: {module.faculty}
        </Typography>
      )}

      {module.department && (
        <Typography variant="body2" color="text.secondary">
          Department: {module.department}
        </Typography>
      )}

      {module.description && <ExpandableText text={module.description} />}

      <Divider flexItem sx={{ my: 1.5 }} />

      {/* Prerequisite Tree Section */}
      {module.requires && (
        <>
          <Typography variant="subtitle1" fontWeight={600}>
            Prerequisites
          </Typography>
          <PrereqTreeView prereqTree={module.requires} />
          <Divider flexItem sx={{ my: 1.5 }} />
        </>
      )}

      <Typography variant="body1">
        Offered: {formatSemesters(module.semestersOffered)}
      </Typography>

      {module.exam ? (
        <Typography variant="body1">
          Exam: {formatExam(module.exam.startTime)} (
          {module.exam.durationMinutes} min)
        </Typography>
      ) : (
        <Typography variant="body1">Exam: Not Available</Typography>
      )}

      <Typography variant="body1">
        Status: {formatModuleStatus(module.status)}
      </Typography>

      <Typography variant="body1">
        Planned Semester:{" "}
        {module.plannedSemester != null && module.plannedSemester >= 0
          ? formatSemesterIndex(module.plannedSemester)
          : "Unplanned"}
      </Typography>

      {module.grade && (
        <Typography variant="body1">Grade: {module.grade}</Typography>
      )}

      {module.preclusions?.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Preclusions: {module.preclusions.join(", ")}
        </Typography>
      )}
    </Box>
  );
};

export default ModuleDetails;

// Helpers
function formatExam(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSemesterIndex(index: number): string {
  const year = Math.floor(index / 2) + 1;
  const sem = index % 2 === 0 ? 1 : 2;
  return `Y${year}S${sem}`;
}

function formatModuleStatus(status?: ModuleStatus): string {
  switch (status) {
    case ModuleStatus.Locked:
      return "Locked";
    case ModuleStatus.Unlocked:
      return "Unlocked";
    case ModuleStatus.Completed:
      return "Completed";
    case ModuleStatus.Blocked:
      return "Blocked";
    default:
      return "Unplanned";
  }
}

function formatSemesters(semesters: SemesterLabel[]): string {
  return semesters
    .map((s) => {
      switch (s) {
        case SemesterLabel.First:
          return "Semester 1";
        case SemesterLabel.Second:
          return "Semester 2";
        case SemesterLabel.SpecialTerm1:
          return "Special Term I";
        case SemesterLabel.SpecialTerm2:
          return "Special Term II";
        default:
          return "Unknown";
      }
    })
    .join(", ");
}
