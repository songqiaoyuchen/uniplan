import Box from '@mui/material/Box';
import Timetable from './Timetable';
import Grid from '@mui/material/Grid';

const PlannerContainer: React.FC = () => {
  return (
    <Box padding={4}>
      <Grid container spacing={{ xs: 2, md: 4 }} columns={{ xs: 1, md: 12 }}>
        {/* Timetable Section */}
        <Grid size={{ xs: 1, md: 8 }}>
          <Timetable />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlannerContainer;
