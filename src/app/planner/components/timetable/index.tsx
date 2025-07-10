import Box from "@mui/material/Box";
import PlannerSemester from "./PlannerSemester";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface TimetableProps {
  overSemesterId: string | null;
}

function Timetable({ overSemesterId }: TimetableProps) {
  const semesters = useSelector((state: RootState) => state.planner.semesters);
  const isOpen = useSelector((state: RootState) => state.sidebar.isOpen);
  const sidebarWidth = isOpen ? 300 : 36;

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
        {semesters.map((_, index) => (
          <PlannerSemester
            key={index}
            semesterIndex={index}
            isActive={overSemesterId === index.toString()}
          />
        ))}
      </Box>
    </Box>
  );
}

export default Timetable;
