'use client';

import { ModuleData, SemesterOffering } from '@/types/plannerTypes';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material';

interface ModuleDetailsProps {
  module: ModuleData;
}

const ModuleDetails: React.FC<ModuleDetailsProps> = ({ module }) => {

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        width: '100%',
        whiteSpace: 'normal',
        wordBreak: 'break-word', 
      }}
    >
      {/* Module Code (Title) */}
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ width: '100%', wordBreak: 'break-word' }} 
      >
        {module.code}
      </Typography>

      {/* Module Title (Subtitle) */}
      <Typography
        variant="subtitle2"
        fontWeight={500}
        color='text.secondary'
        sx={{ width: '100%', wordBreak: 'break-word'}}
      >
        {module.title}
      </Typography>

      <Divider flexItem sx={{ my: 1 }} />

      {/* Details */}
      <Typography variant="body1" sx={{ width: '100%' }}>
        Credits: {module.credits}
      </Typography>

      <Typography variant="body1" sx={{ width: '100%' }}>
        Offered: {formatSemesterOffering(module.semestersOffered)}
      </Typography>

      {module.exam && (
        <Typography variant="body1" sx={{ width: '100%' }}>
          Exam: {formatExam(module.exam.startTime)} ({module.exam.durationMinutes} min)
        </Typography>
      )}

      <Typography variant="body1" sx={{ width: '100%' }}>
        Status: {module.status}
      </Typography>

      <Typography variant="body1" sx={{ width: '100%' }}>
        Planned Sem: {module.plannedSemester + 1}
      </Typography>
    </Box>
  );
};

export default ModuleDetails;

// Helper Functions
function formatSemesterOffering(offering: SemesterOffering): string {
  switch (offering) {
    case SemesterOffering.Both:
      return 'Sem 1 & 2';
    case SemesterOffering.First:
      return 'Sem 1';
    case SemesterOffering.Second:
      return 'Sem 2';
    default:
      return '';
  }
}

function formatExam(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
