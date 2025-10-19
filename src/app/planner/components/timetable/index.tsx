import Box from "@mui/material/Box";
import TimetableSemester from "./TimeTableSemester";
import { useSelector } from "react-redux";
import { RootState, useAppSelector } from "@/store";
import { selectSemesterIds } from "@/store/timetableSelectors";
import { memo } from "react";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "@/constants";
import TimetableHeader from "./TimetableHeader";

function Timetable() {
  const semesterIds = useAppSelector(selectSemesterIds) as number[];
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 0,
        my: 2,
        marginRight: { xs: 2, md: 4 },
        marginLeft: { xs: 2, md: `${sidebarWidth + 32}px` },
        transition: "margin-left 0.3s",
        flex: 1,
        minWidth: 0,
      }}
    >
      <TimetableHeader />
      {/* semesters */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          overflowX: "auto",
          overflowY: "hidden",
          py: 1,
          gap: 1,
          borderRadius: 1,
              flex: 1,
    minHeight: 0,
        }}
      >
        {semesterIds.map((semesterId) => (
          <TimetableSemester
            key={semesterId}
            semesterId={semesterId}
          />
        ))}
      </Box>
    </Box>
  );
}

export default memo(Timetable);
