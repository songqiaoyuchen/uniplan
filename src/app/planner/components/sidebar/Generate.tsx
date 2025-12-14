import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FlagIcon from '@mui/icons-material/Flag';
import BlockIcon from '@mui/icons-material/Block';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import { useMemo } from 'react';
import miniModuleData from '@/data/miniModuleData.json';
import { useLazyGetTimetableQuery } from '@/store/apiSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { 
  targetModuleRemoved, 
  exemptedModuleRemoved, 
  specialTermsToggled, 
  maxMcsUpdated,
  preserveTimetableToggled,
  preserveSemestersUpdated,
  semestersAdapter
} from '@/store/timetableSlice';
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

  const { 
    useSpecialTerms, 
    maxMcsPerSemester, 
    preserveTimetable, 
    preserveSemesters 
  } = useSelector((state: RootState) => state.timetable);

  const allSemesters = useSelector((state: RootState) => semestersAdapter.getSelectors().selectAll(state.timetable.semesters));
  const totalSemesters = allSemesters.length;

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

  const handleGenerate = () => {
    const preservedData: Record<number, string[]> = {};
    
    if (preserveTimetable && preserveSemesters > 0) {
       const sortedSemesters = [...allSemesters].sort((a, b) => a.id - b.id);
       const semestersToPreserve = sortedSemesters.slice(0, preserveSemesters);
       
       semestersToPreserve.forEach(s => {
         preservedData[s.id] = s.moduleCodes;
       });
    }

    triggerGetTimetable({
      requiredModuleCodes: targetModuleCodes,
      exemptedModuleCodes: exemptedModuleCodes,
      useSpecialTerms: useSpecialTerms,
      maxMcsPerSemester: maxMcsPerSemester,
      preserveTimetable: preserveTimetable,
      preserveSemesters: preserveSemesters,
      preservedData: preservedData
    });
  };

  const handleSpecialTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(specialTermsToggled());
  };

  const handlePreserveTimetableChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(preserveTimetableToggled());
  };

  const handlePreserveSemestersChange = (event: Event, newValue: number | number[]) => {
    dispatch(preserveSemestersUpdated(newValue as number));
  };

  const handleIncrementMcs = () => {
    if (maxMcsPerSemester < 40) {
      dispatch(maxMcsUpdated(maxMcsPerSemester + 2));
    }
  };

  const handleDecrementMcs = () => {
    if (maxMcsPerSemester > 16) {
      dispatch(maxMcsUpdated(maxMcsPerSemester - 2));
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
        
        {targetModules.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {targetModules.map((module) => (
              <MiniModuleCard
                key={module.code}
                module={module}
                showDelete={true}
                onDelete={handleDeleteTarget}
              />
            ))}
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: 2, 
              border: '1px dashed', 
              borderColor: 'divider', 
              borderRadius: 1,
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InfoOutlinedIcon color="action" sx={{ fontSize: 20 }} />
            <Typography variant="caption" color="text.secondary" align="center">
              No target modules selected. Search for modules to add them here.
            </Typography>
          </Box>
        )}
      </Box>

      {/* Exempted Modules Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <BlockIcon sx={{ fontSize: '1.2rem', color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Exempted Modules
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({exemptedModules.length})
          </Typography>
        </Box>

        {exemptedModules.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {exemptedModules.map((module) => (
              <MiniModuleCard
                key={module.code}
                module={module}
                showDelete={true}
                onDelete={handleDeleteExempted}
              />
            ))}
          </Box>
        ) : (
          <Box 
            sx={{ 
              p: 2, 
              border: '1px dashed', 
              borderColor: 'divider', 
              borderRadius: 1,
              bgcolor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <InfoOutlinedIcon color="action" sx={{ fontSize: 20 }} />
            <Typography variant="caption" color="text.secondary" align="center">
              No exempted modules. Search for modules to exempt them.
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Max MCs Stepper */}
      <Box>
        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, pb: 1 }}>
          Max units per semester
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 0.5
        }}>
          <IconButton 
            size="small" 
            onClick={handleDecrementMcs}
            disabled={maxMcsPerSemester <= 16}
            color="primary"
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          
          <Typography variant="body1" sx={{ fontWeight: 500, minWidth: '3ch', textAlign: 'center' }}>
            {maxMcsPerSemester}
          </Typography>
          
          <IconButton 
            size="small" 
            onClick={handleIncrementMcs}
            disabled={maxMcsPerSemester >= 40}
            color="primary"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
          Recommended: 20-24 Units
        </Typography>
      </Box>
      
      {/* Special Terms Toggle */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControlLabel
          sx={{ ml: 0 }}
          control={
            <Switch
              checked={useSpecialTerms}
              onChange={handleSpecialTermsChange}
              name="specialTerms"
              color="primary"
              size="small"
            />
          }
          label={
            <Typography variant="body2">Include Special Terms</Typography>
          }
        />

        {/* Preserve Timetable Toggle */}
        <Box>
          <FormControlLabel
            sx={{ ml: 0 }}
            control={
              <Switch
                checked={preserveTimetable}
                onChange={handlePreserveTimetableChange}
                name="preserveTimetable"
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="body2">Preserve Current Timetable</Typography>
            }
          />
          
          {preserveTimetable && (
            <Box sx={{ px: 1, mt: 1 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Preserve first {preserveSemesters} semesters
              </Typography>
              <Slider
                value={preserveSemesters}
                onChange={handlePreserveSemestersChange}
                step={1}
                marks
                min={0}
                max={totalSemesters > 0 ? totalSemesters : 8}
                valueLabelDisplay="auto"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Generate Button */}
      <Box sx={{ mt: 'auto', pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleGenerate}
          disabled={!isFormValid || isFetching}
          sx={{ 
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 2
          }}
        >
          {isFetching ? 'Generating...' : 'Generate Timetable'}
        </Button>
        
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Error generating timetable. Please try again.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default Generate;

