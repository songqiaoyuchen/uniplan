import * as React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import { useAppSelector } from "@/store";
import { minimalViewToggled } from "@/store/timetableSlice";
import { useDispatch } from "react-redux";
import { useCallback, useState, useEffect } from "react";
import {
  selectLatestNormalSemester,
  selectTotalCredits,
} from "@/store/timetableSelectors";
import { useLazyGetTimetableQuery } from "@/store/apiSlice";
import { timetableRenamed } from "@/store/plannerSlice";
import TimetableDropdown from "./TimetableDropdown"; 

const TimetableHeader: React.FC = () => {
  const dispatch = useDispatch();

  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);

  // current active timetable
  const timetable = useAppSelector((state) => {
    const { semesters, modules } = state.timetable;
    return { semesters, modules };
  });

  // active timetable name from plannerSlice
  const activeName = useAppSelector(
    (state) => state.planner.activeTimetableName
  ) ?? "New Timetable";

  const [triggerGetTimetable, { isFetching }] = useLazyGetTimetableQuery();

  // TESTING DATA
  const requiredModuleCodes = [
    "MA1301", "MA5401", "CS5330", "MA5198", "HSA1000", "NGN2001A",
    "CP4101", "CS1101S", "CS2030S", "CS2040S", "CS1231S", "CS2105", "CS2109S",
    "CS2103T", "CS2100", "ST2334", "CS2107", "Cs3230", "DTK1234", "MA2002",
    "MA2001", "ES2660", "MA2101", "MA2104", "MA2108", "IS1108", "MA2202",
    "MA2213", "MA5206"
  ];
  const exemptedModuleCodes: string[] = [];

  // Title editing mirrors active timetable name
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(activeName);
  useEffect(() => setTempName(activeName), [activeName]);

  const totalCredits = useAppSelector(selectTotalCredits);
  const latestNormalSemester = useAppSelector(selectLatestNormalSemester) ?? 0;
  const estimatedTrackDuration = latestNormalSemester / 4 + 0.5;

  const commitRename = () => {
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === activeName) {
      setIsEditingName(false);
      setTempName(activeName);
      return;
    }
    dispatch(timetableRenamed({ oldName: activeName, newName: trimmed }));
    setIsEditingName(false);
  };

  return (
    <Box sx={{ px: 0.5, py: 1 }}>
      <Stack
        direction="row"
        spacing={3}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {/* Editable title + dropdown */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {isEditingName ? (
            <TextField
              variant="standard"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                  setTempName(activeName);
                }
              }}
              inputProps={{ style: { fontSize: 24, fontWeight: 500 } }}
              sx={{ minWidth: 200 }}
            />
          ) : (
            <Typography
              variant="h4"
              onClick={() => setIsEditingName(true)}
              sx={{
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 300,
                py: 0.85, // avoids layout shift
              }}
              title={activeName}
            >
              {activeName}
            </Typography>
          )}

          <IconButton
            size="small"
            onClick={() => (isEditingName ? commitRename() : setIsEditingName(true))}
            sx={{ color: isEditingName ? "success.main" : "text.secondary" }}
          >
            {isEditingName ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>

          {/* Modularised dropdown */}
          <TimetableDropdown />
        </Stack>

        {/* Total Credits */}
        <Typography variant="body1" color="text.secondary" marginLeft="auto">
          <b>{totalCredits}</b> units / <b>{estimatedTrackDuration}</b> years
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={() => triggerGetTimetable({ requiredModuleCodes, exemptedModuleCodes })}
          >
            {isFetching ? "Loading timetable..." : "Test Import Timetable"}
          </Button>
          <Button
            variant="outlined"
            onClick={() => dispatch(minimalViewToggled())}
          >
            {isMinimalView ? "Detailed View" : "Minimal View"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TimetableHeader;
