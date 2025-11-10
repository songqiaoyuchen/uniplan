import { useAppDispatch, useAppSelector } from "@/store";
import { useMemo } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { makeSelectSemesterHeaderInfo, selectIsMinimalView, selectLatestNormalSemester } from "@/store/timetableSelectors";
import { SemesterLabel } from "@/types/plannerTypes";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import { semesterRemoved } from "@/store/timetableSlice";

interface SemesterHeaderProps {
  semesterId: number;
  isEmpty?: boolean;
}

const getSemesterTitles = (semesterId: number): { full: string; abbrev: string } => {
  const year = Math.floor(semesterId / 4) + 1;
  const semesterType = semesterId % 4;

  switch (semesterType) {
    case SemesterLabel.First:
      return { full: `Year ${year} Semester 1`, abbrev: `Y${year}S1` };
    case SemesterLabel.SpecialTerm1:
      return { full: `Year ${year} Winter`, abbrev: `Y${year} Winter` };
    case SemesterLabel.Second:
      return { full: `Year ${year} Semester 2`, abbrev: `Y${year}S2` };
    case SemesterLabel.SpecialTerm2:
      return { full: `Year ${year} Summer`, abbrev: `Y${year} Summer` };
    default:
      return { full: `Year ${year}`, abbrev: `Y${year}` };
  }
};

export default function SemesterHeader({ semesterId, isEmpty }: SemesterHeaderProps) {
  const dispatch = useAppDispatch();
  const isMinimalView = useAppSelector(selectIsMinimalView);
  const selectSemesterHeaderInfo = useMemo(makeSelectSemesterHeaderInfo, []);

  const { totalCredits } = useAppSelector((state) => {
    const semester = state.timetable.semesters.entities[semesterId];
    if (!semester) return { totalCredits: 0 };
    return selectSemesterHeaderInfo(state, semesterId);
  });

  const isSpecialTerm = semesterId % 2 === 1;
  const latestNormalSemester = useAppSelector(selectLatestNormalSemester);
  const showDelete = (isSpecialTerm || latestNormalSemester == semesterId) && isEmpty;
  
  const { full: fullTitle, abbrev } = getSemesterTitles(semesterId);
  const displayTitle = isMinimalView ? abbrev : fullTitle;

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          px: isMinimalView ? 0.5 : 1.5,
          py: isMinimalView ? 0.5 : 1,
          backgroundColor: "action.hover",
          display: "flex",
          flexDirection: isMinimalView ? "column" : "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: isMinimalView ? 0 : 0.5,
        }}
      >
        <Typography
          variant={isMinimalView ? "caption" : "subtitle2"}
          sx={{
            px: isMinimalView ? 0.5 : 0,
            fontWeight: isMinimalView ? 500 : 600,
            justifyContent: "center",
            width: isMinimalView ? "100%" : "auto",
          }}
        >
          {displayTitle}
        </Typography>
        
        {showDelete ? (
          <IconButton
            size="small"
            onClick={() => dispatch(semesterRemoved({semesterId}))}
            sx={{
              padding: 0.5,
              borderRadius: 0.5, 
              alignSelf: "flex-end",
              marginLeft: "auto",
              color: "common.white",
              "&:hover": {
                backgroundColor: "error.main",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 12 }} />
          </IconButton>
        )
        : <Typography
            variant={isMinimalView ? "caption" : "body2"}
            color="text.secondary"
            sx={{
              px: isMinimalView ? 0.5 : 0,
              textAlign: "right",
              width: isMinimalView ? "100%" : "auto",
            }}
          >
            {totalCredits} MC
          </Typography>}
      </Paper>
    </Box>
  );
}
