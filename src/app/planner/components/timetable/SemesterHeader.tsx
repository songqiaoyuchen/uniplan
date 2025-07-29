import { useAppSelector } from "@/store";
import { useMemo } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { makeSelectSemesterHeaderInfo, selectIsMinimalView } from "@/store/timetableSelectors";

interface SemesterHeaderProps {
  semesterId: number;
}

// Helper function to generate semester titles
const getSemesterTitles = (semesterId: number): { full: string; abbrev: string } => {
  const year = Math.floor(semesterId / 4) + 1;
  const semesterType = semesterId % 4;

  switch (semesterType) {
    case 0:
      return { full: `Year ${year} Semester 1`, abbrev: `Y${year}S1` };
    case 1:
      return { full: `Year ${year} Winter`, abbrev: `Y${year} Winter` };
    case 2:
      return { full: `Year ${year} Semester 2`, abbrev: `Y${year}S2` };
    case 3:
      return { full: `Year ${year} Summer`, abbrev: `Y${year} Summer` };
    default:
      return { full: `Year ${year}`, abbrev: `Y${year}` };
  }
};

export default function SemesterHeader({ semesterId }: SemesterHeaderProps) {
  const isMinimalView = useAppSelector(selectIsMinimalView);

  // Create selector instance
  const selectSemesterInfo = useMemo(makeSelectSemesterHeaderInfo, []);
  const { totalMCs } = useAppSelector((state) =>
    selectSemesterInfo(state, semesterId)
  );

  const { full: fullTitle, abbrev } = getSemesterTitles(semesterId);
  const displayTitle = isMinimalView ? abbrev : fullTitle;

  return (
    <Paper
      elevation={0}
      sx={{
        px: isMinimalView ? 1 : 2,
        py: isMinimalView ? 0.5 : 1,
        backgroundColor: "action.hover",
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMinimalView ? "flex-start" : "center",
        flexDirection: isMinimalView ? "column" : "row",
        gap: isMinimalView ? 0 : 0.5,
      }}
    >
      <Typography
        variant={isMinimalView ? "caption" : "subtitle2"}
        sx={{
          fontWeight: isMinimalView ? 500 : 600,
          textAlign: isMinimalView ? "left" : "center",
          width: isMinimalView ? '100%' : 'auto',
        }}
      >
        {displayTitle}
      </Typography>
      <Typography
        variant={isMinimalView ? "caption" : "body2"}
        color="text.secondary"
        sx={{
          textAlign: 'right',
          width: isMinimalView ? '100%' : 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {totalMCs} MC
      </Typography>

    </Paper>
  );
}
