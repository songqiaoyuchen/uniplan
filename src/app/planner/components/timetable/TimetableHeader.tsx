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
import { useCallback, useState } from "react";
import {
  selectLatestNormalSemester,
  selectTotalCredits,
} from "@/store/timetableSelectors";
import { useLazyGetTimetableQuery } from "@/store/apiSlice";

const TimetableHeader = () => {
  const dispatch = useDispatch();
  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);
  const timetable = useAppSelector((state) => {
    const { semesters, modules } = state.timetable;
    return { semesters, modules };
  });
   const [triggerGetTimetable, { isFetching }] = useLazyGetTimetableQuery();
   const requiredModuleCodes = [
    "MA1301", "MA5401", "CS5330", "MA5198", "HSA1000", "NGN2001A",
    "CP4101", "CS1101S", "CS2030S", "CS2040S", "CS1231S", "CS2105", "CS2109S",
    "CS2103T", "CS2100", "ST2334", "CS2107", "Cs3230", "DTK1234", "MA2002",
    "MA2001", "ES2660", "MA2101", "MA2104", "MA2108", "IS1108", "MA2202",
    "MA2213", "MA5206"
  ];
  const exemptedModuleCodes = [] as string[];
  

  const [timetableName, setTimetableName] = useState("New Timetable");
  const [isEditingName, setIsEditingName] = useState(false);

  const totalCredits = useAppSelector(selectTotalCredits);
  const latestNormalSemester = useAppSelector(selectLatestNormalSemester);

  const estimatedTrackDuration = latestNormalSemester / 4 + 0.5;

  const handleSave = useCallback(() => {
    try {
      const serialized = JSON.stringify(timetable);
      localStorage.setItem(timetableName, serialized);
      alert("Timetable saved!");
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save timetable.");
    }
  }, [timetable, timetableName]);

  return (
    <Box sx={{ px: 0.5, py: 1 }}>
      <Stack
        direction="row"
        spacing={3}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
      >
        {/* Editable title using TextField */}
        <Stack direction="row" alignItems="center" spacing={1}>
          {isEditingName ? (
            <TextField
              variant="standard"
              autoFocus
              value={timetableName}
              onChange={(e) => {
                setTimetableName(e.target.value);
              }}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setIsEditingName(false);
                }
              }}
              inputProps={{
                style: { fontSize: 24, fontWeight: 500 },
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
                py: 0.85, // why i have to set this to prevent layout shift?
              }}
            >
              {timetableName}
            </Typography>
          )}

          <IconButton
            size="small"
            onClick={() => setIsEditingName((prev) => !prev)}
            sx={{ color: isEditingName ? "success.main" : "text.secondary" }}
          >
            {isEditingName ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
        </Stack>

        {/* Total Credits */}
        <Typography variant="body1" color="text.secondary" marginLeft="auto">
          <b>{totalCredits}</b> units / <b>{estimatedTrackDuration}</b> years
        </Typography>

        {/* Buttons */}
        <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={() => triggerGetTimetable({ requiredModuleCodes, exemptedModuleCodes })}>
          {isFetching ? "Loading timetable..." : "Test Import Timetable"}
        </Button>
          <Button variant="outlined" onClick={handleSave}>
            Save
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
