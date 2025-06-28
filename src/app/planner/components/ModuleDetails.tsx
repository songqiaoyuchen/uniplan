'use client';

import { ModuleData, SemesterOffering, ModuleStatus } from '@/types/plannerTypes';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ExpandableText from '@/app/components/ui/ExpandableText';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import { useDraggable } from '@dnd-kit/core';
import { useDispatch } from 'react-redux';
import { addModule } from '@/store/plannerSlice';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';



interface ModuleDetailsProps {
  module: ModuleData;
}

const ModuleDetails: React.FC<ModuleDetailsProps> = ({ module }) => {
  const dispatch = useDispatch();
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: module.id + '-sidebar',
    data: {
      type: 'module',
      module,
      isNew: true,
    },
  });

  useEffect(() => {
    dispatch(addModule(module));
  }, [dispatch, module]);

  const isPlanned = useSelector((state: RootState) =>
    state.planner.semesters.some((sem) => sem.includes(module.id))
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        width: '100%',
        px: 1,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}
    >
      {/* Header */}
      <Typography variant="h5" fontWeight={700} display="flex" alignItems="center">
        {module.code}
        {!isPlanned && (
        <Box
          component="span"
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          sx={{
            ml: 1,
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'grab',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <IconButton size="small" sx={{ p: 0.5 }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>)}
      </Typography>


      <Typography variant="subtitle2" color='primary.extraLight'>{module.credits}MC</Typography>

      <Typography variant="subtitle2" fontWeight={500} color="text.secondary">
        {module.title}
      </Typography>

      {module.faculty && (
        <Typography variant="body2" color="text.secondary">
          Faculty: {module.faculty}
        </Typography>
      )}

      {module.department && (
        <Typography variant="body2" color="text.secondary">
          Department: {module.department}
        </Typography>
      )}
      
      {module.description && (
        <ExpandableText text={module.description} />
      )}

      <Divider flexItem sx={{ my: 1.5 }} />

      {/* Details */}
      <Typography variant="body1">
        Offered: {formatSemesterOffering(module.semestersOffered)}
      </Typography>

      {module.exam ? (
        <Typography variant="body1">
          Exam: {formatExam(module.exam.startTime)} ({module.exam.durationMinutes} min)
        </Typography>
      ) : (
        <Typography variant="body1">Exam: Not Available</Typography>
      )}

      <Typography variant="body1">
        Status: {formatModuleStatus(module.status)}
      </Typography>

      <Typography variant="body1">
        Planned Semester: {module.plannedSemester > 0 ? `Y${Math.floor((module.plannedSemester + 1) / 2)}S${((module.plannedSemester + 1) % 2) || 2}` : 'Unplanned'}
      </Typography>

      {module.grade && (
        <Typography variant="body1">Grade: {module.grade}</Typography>
      )}

      {module.preclusions?.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Preclusions: {module.preclusions.join(', ')}
        </Typography>
      )}
    </Box>
  );
};

export default ModuleDetails;

// pasers

function formatSemesterOffering(sem: SemesterOffering): string {
  switch (sem) {
    case SemesterOffering.Both:
      return 'Sem 1 & 2';
    case SemesterOffering.First:
      return 'Sem 1';
    case SemesterOffering.Second:
      return 'Sem 2';
    default:
      return 'Unplanned';
  }
}

function formatExam(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatModuleStatus(status?: ModuleStatus): string {
  switch (status) {
    case ModuleStatus.Locked:
      return 'Locked';
    case ModuleStatus.Unlocked:
      return 'Unlocked';
    case ModuleStatus.Completed:
      return 'Completed';
    default:
      return 'Unplanned';
  }
}
