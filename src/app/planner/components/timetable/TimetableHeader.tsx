import { Box, Button, Typography, Stack, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useLazyGetTimetableQuery } from "@/store/apiSlice";
import { useAppSelector } from "@/store";
import { minimalViewToggled } from "@/store/timetableSlice";
import { useDispatch } from "react-redux";

const TimetableHeader = () => {
  const [triggerGetTimetable, { isFetching }] = useLazyGetTimetableQuery();
  const isMinimalView = useAppSelector((state) => state.timetable.isMinimalView);
  const dispatch = useDispatch();

  const requiredModuleCodes = ["CS1101S"];
  const exemptedModuleCodes = [] as string[];
  
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="h3" px={1} >Sample Timetable</Typography>
        <Tooltip title="Timetable generated from static sample data">
          <InfoOutlinedIcon fontSize="medium" sx={{ color: "text.secondary" }} />
        </Tooltip>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => triggerGetTimetable({ requiredModuleCodes, exemptedModuleCodes })}>
          {isFetching ? "Loading timetable..." : "Test Import Timetable"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => dispatch(minimalViewToggled())}
        >
          {isMinimalView ? "Switch to Detailed View" : "Switch to Minimal View"}
        </Button>
      </Stack>
    </Box>
  );
};

export default TimetableHeader;
