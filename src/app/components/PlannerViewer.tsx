'use client';
import { useState } from 'react';
import { TextField, Button, Grid, Typography, Box } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { scheduleModules } from '../../temp/scheduleModules';
import { convertToSchedulingInput } from '../../temp/convertToInput';

type ScheduleResult = {
  [semester: number]: string[];
};

export default function PlannerViewer() {
  const [targetInput, setTargetInput] = useState('');
  const [semesters, setSemesters] = useState(16);
  const [maxPerSem, setMaxPerSem] = useState(5);
  const [plan, setPlan] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState('');

  function getSemesterLabel(index: number): string {
    const year = Math.floor((index - 1) / 4) + 1;
    const pos = (index - 1) % 4;

    const label =
      pos === 0 ? `Semester ${Math.floor(index / 2)%2 + 1}` :
      pos === 1 ? `Semester ${Math.floor(index / 2)%2 + 1}` :
      pos === 2 ? `Special Term 1` :
      `Special Term 2`;

    return `Year ${year} – ${label}`;
  }

  async function handleGenerate() {
    setError('');
    setPlan(null);

    try {
      const parsedTargets = targetInput
        .split(',')
        .map(code => code.trim().toUpperCase())
        .filter(code => code.length > 0);

      if (parsedTargets.length === 0) {
        setError('❌ Please enter at least one module code.');
        return;
      }

      const queryParam = parsedTargets.join(',');
      const response = await fetch(`/api/fetchGraph?moduleCodes=${encodeURIComponent(queryParam)}`);

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const { nodes, relationships } = await response.json();
      console.group("🔍 Raw graph from API");
      console.log(nodes);
      console.log(relationships);
      console.groupEnd();

      const input = convertToSchedulingInput(nodes, relationships, parsedTargets);
      console.log(input.dependencies);

      const result = scheduleModules(input, maxPerSem, semesters);
      console.log(result);

      if (!result) {
        setError('❌ Cannot construct a valid plan. Some modules may be unschedulable.');
      } else {
        setPlan(result);
      }

    } catch (err) {
      console.error(err);
      setError('❌ Error occurred while generating plan.');
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>📘 Module Planner</Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid size={{xs: 12, sm: 4}}>
          <TextField
            label="Target Modules (comma separated)"
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{xs: 6, sm: 3}}>
          <TextField
            label="Semesters"
            type="number"
            value={semesters}
            onChange={e => setSemesters(+e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{xs: 6, sm: 3}}>
          <TextField
            label="Max / Semester"
            type="number"
            value={maxPerSem}
            onChange={e => setMaxPerSem(+e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{xs: 12, sm: 2}}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </Grid>
      </Grid>

      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}

      {plan && (
        <Box mt={4}>
          <Typography variant="h6">🗓️ Planned Timetable</Typography>

          <Timeline position="alternate">
            {Object.entries(plan)
              .sort(([a], [b]) => {
                const ai = +a, bi = +b;
                const ay = Math.floor((ai - 1) / 4), by = Math.floor((bi - 1) / 4);
                const apos = (ai - 1) % 4, bpos = (bi - 1) % 4;
              
                const aorder = ay * 10 + (apos === 0 ? 0 : apos === 2 ? 1 : apos === 1 ? 2 : 3);
                const border = by * 10 + (bpos === 0 ? 0 : bpos === 2 ? 1 : bpos === 1 ? 2 : 3);
                return aorder - border;
              })
              .map(([sem, modules], index) => (
                <TimelineItem key={sem}>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    {index < Object.keys(plan).length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {getSemesterLabel(+sem)}
                    </Typography>
                    {modules.map((m, i) => (
                      <Typography key={i} variant="body2">• {m}</Typography>
                    ))}
                  </TimelineContent>
                </TimelineItem>
              ))}
          </Timeline>
        </Box>
      )}
    </Box>
  );
}
