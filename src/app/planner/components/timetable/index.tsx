import Box from "@mui/material/Box";
import PlannerSemester from "./TimeTableSemester";
import { useSelector } from "react-redux";
import { RootState, useAppSelector } from "@/store";
import { selectSemesterIds } from "@/store/timetableSelectors";
import { memo } from "react";
import { Button } from "@mui/material";
import { useLazyGetTimetableQuery } from "@/store/apiSlice";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/constants";

function Timetable() {
  const semesterIds = useAppSelector(selectSemesterIds) as number[];
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  const [triggerGetTimetable, { isFetching }] = useLazyGetTimetableQuery();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        p: 0,
        my: "16px",
        marginRight: { xs: 2, md: 4 },
        marginLeft: { xs: 2, md: `${sidebarWidth + 32}px` },
        transition: "margin-left 0.3s",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Button
        onClick={() => triggerGetTimetable()}
      >
        {isFetching ? "Loading timetable..." : "Test Import Timetable"}
      </Button>
      {/* semesters */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          minHeight: "650px",
          flexDirection: "row",
          overflowX: "auto",
          overflowY: "hidden",
          p: 2,
          gap: 0,
          boxShadow: 2,
          backgroundColor: "background.paper",
          borderRadius: 1,
        }}
      >
        {semesterIds.map((semesterId) => (
          <PlannerSemester
            key={semesterId}
            semesterId={semesterId}
          />
        ))}
      </Box>
    </Box>
  );
}

export default memo(Timetable);
