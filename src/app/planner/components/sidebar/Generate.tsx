import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import BlockIcon from '@mui/icons-material/Block';
import { useMemo } from 'react';
import miniModuleData from '@/data/miniModuleData.json';
import { useLazyGetTimetableQuery } from '@/store/apiSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { targetModuleRemoved, exemptedModuleRemoved } from '@/store/timetableSlice';
import MiniModuleCard from '../timetable/MiniModuleCard';
import { ModuleStatus } from '@/types/plannerTypes';

const Generate: React.FC = () => {
  const dispatch = useAppDispatch();
  const [triggerGetTimetable, { isFetching, error }] = useLazyGetTimetableQuery();

  const targetModuleCodes = useSelector((state: RootState) => {
    const targeted = state.timetable.targetModules;
    return Array.isArray(targeted) ? targeted : [];
  });

  const exemptedModuleCodes = useSelector((state: RootState) => {
    const exempted = state.timetable.exemptedModules;
    return Array.isArray(exempted) ? exempted : [];
  });

  // Create module objects from codes
  const targetModules = useMemo(() => {
    return targetModuleCodes
      .map(code => {
        const moduleData = miniModuleData.find(m => m.code === code);
        return moduleData ? {
          code: moduleData.code,
          title: moduleData.title,
          status: ModuleStatus.Satisfied
        } : null;
      })
      .filter(Boolean) as Array<{ code: string; title: string; status: ModuleStatus }>;
  }, [targetModuleCodes]);

  const exemptedModules = useMemo(() => {
    return exemptedModuleCodes
      .map(code => {
        const moduleData = miniModuleData.find(m => m.code === code);
        return moduleData ? {
          code: moduleData.code,
          title: moduleData.title,
          status: ModuleStatus.Satisfied
        } : null;
      })
      .filter(Boolean) as Array<{ code: string; title: string; status: ModuleStatus }>;
  }, [exemptedModuleCodes]);

  const handleDeleteTarget = (moduleCode: string) => {
    dispatch(targetModuleRemoved(moduleCode));
  };

  const handleDeleteExempted = (moduleCode: string) => {
    dispatch(exemptedModuleRemoved(moduleCode));
  };

  const handleGenerate = async () => {
    if (targetModuleCodes.length === 0) {
      console.warn('No modules selected for generation');
      return;
    }

    try {
      const result = await triggerGetTimetable({
        requiredModuleCodes: targetModuleCodes,
        exemptedModuleCodes: exemptedModuleCodes
      }).unwrap();
      
    } catch (error) {
      console.error('Error generating timetable:', error);
    }
  };

  const isFormValid = targetModuleCodes.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Generate Your Timetable
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Review your targeted and exempted modules before generating your timetable
        </Typography>
      </Box>

      {/* Target Modules Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <FlagIcon sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Target Modules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({targetModules.length})
          </Typography>
        </Box>
        
        {targetModules.length === 0 ? (
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            textAlign: 'center'
          }}>
            <Typography variant="caption" color="text.secondary">
              No target modules selected.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            p: 1
          }}>
            {targetModules.map((module) => (
              <MiniModuleCard
                key={module.code}
                module={module}
                showDelete={true}
                onDelete={handleDeleteTarget}
              />
            ))}
          </Box>
        )}
      </Box>

      <Divider />

      {/* Exempted Modules Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <BlockIcon sx={{ fontSize: '1.2rem', color: 'warning.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Exempted Modules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({exemptedModules.length})
          </Typography>
        </Box>
        
        {exemptedModules.length === 0 ? (
          <Box sx={{ 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            textAlign: 'center'
          }}>
            <Typography variant="caption" color="text.secondary">
              No exempted modules selected.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            p: 1
          }}>
            {exemptedModules.map((module) => (
              <MiniModuleCard
                key={module.code}
                module={module}
                showDelete={true}
                onDelete={handleDeleteExempted}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Info Message */}
      {!isFormValid && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 1.5,
          backgroundColor: 'info.lighter',
          borderRadius: 1,
          border: 1,
          borderColor: 'info.light'
        }}>
          <InfoOutlinedIcon fontSize="small" color="info" />
          <Typography variant="body2" color="info.main">
            Select at least one target module to generate your timetable
          </Typography>
        </Box>
      )}

      {/* Generate Button */}
      <Button
        variant="contained"
        onClick={handleGenerate}
        fullWidth
        disabled={!isFormValid || isFetching}
        sx={{
          py: 1.25,
          fontWeight: 600,
          textTransform: 'none',
          mt: 1
        }}
      >
        {isFetching ? 'Generating...' : 'Generate Timetable'}
      </Button>
      
      {error && (
        <Box sx={{ 
          p: 1.5,
          backgroundColor: 'error.lighter',
          borderRadius: 1,
          border: 1,
          borderColor: 'error.light'
        }}>
          <Typography variant="caption" color="error.main">
            Unable to generate timetable. Please try again.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Generate;