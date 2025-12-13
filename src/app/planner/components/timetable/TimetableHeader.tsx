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
import { useState, useEffect } from "react";
import {
  selectCgpa,
  selectLatestNormalSemester,
  selectTotalCredits,
} from "@/store/timetableSelectors";
import { useLazyGetTimetableQuery } from "@/store/apiSlice";
import { timetableRenamed } from "@/store/plannerSlice";
import TimetableDropdown from "./TimetableDropdown"; 

const TimetableHeader: React.FC = () => {
  const dispatch = useDispatch();

  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);
  const useSpecialTerms = useAppSelector((state) => state.timetable.useSpecialTerms);

  // active timetable name from plannerSlice
  const activeName = useAppSelector(
    (state) => state.planner.activeTimetableName
  ) ?? "New Timetable";

  // Title editing mirrors active timetable name
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(activeName);
  useEffect(() => setTempName(activeName), [activeName]);

  const totalCredits = useAppSelector(selectTotalCredits);
  const Cgpa = useAppSelector(selectCgpa);
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
              slotProps={{
                input: { style: { fontSize: 24, fontWeight: 500 } }
              }}
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

        {/* Stats */}
        <Typography variant="body1" color="text.secondary" marginLeft="auto">
          <b>{totalCredits}</b> Units
          
          {/* Separator */}
          <Box component="span" sx={{ mx: 1 }}>/</Box>
          
          {/* Overall GPA */}
          CGPA: <b>{Cgpa.toFixed(2)}</b>
          
          {/* Separator */}
          <Box component="span" sx={{ mx: 1 }}>/</Box>
          
          <b>{estimatedTrackDuration}</b> Years
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={1}>
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
