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

  const requiredModuleCodes = [
    "MA1301", "MA5401", "CS5330", "MA5198", "HSA1000", "NGN2001A",
    "CP4101", "CS1101S", "CS2030S", "CS2040S", "CS1231S", "CS2105", "CS2109S",
    "CS2103T", "CS2100", "ST2334", "CS2107", "Cs3230", "DTK1234", "MA2002",
    "MA2001", "ES2660", "MA2101", "MA2104", "MA2108", "IS1108", "MA2202",
    "MA2213", "MA5206"
  ];
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
