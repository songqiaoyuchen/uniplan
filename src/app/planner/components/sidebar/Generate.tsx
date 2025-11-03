import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useState, useMemo } from 'react';
import miniModuleData from '@/data/miniModuleData.json';
import { useLazyGetTimetableQuery, useGetModuleByCodeQuery } from '@/store/apiSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { exemptedModuleAdded, exemptedModuleRemoved, moduleCached } from '@/store/timetableSlice';
import { useAppDispatch } from '@/store';

const Generate: React.FC = () => {
  const [degree, setDegree] = useState<string | null>(null);
  const [major, setMajor] = useState<string | null>(null);
  const [cohort, setCohort] = useState<string>('');
  const [additionalTracks, setAdditionalTracks] = useState<Array<{ code: string; title: string; label: string; } | null>>([null]);
  const [exemptedSearchFields, setExemptedSearchFields] = useState<Array<{ code: string; title: string; label: string; } | null>>([null]);
  
  const dispatch = useAppDispatch();
  const [triggerGetTimetable, { isFetching, error }] = useLazyGetTimetableQuery();

  const exemptedModuleCodes = useSelector((state: RootState) => {
    const exempted = state.timetable.exemptedModules;
    return Array.isArray(exempted) ? exempted : [];
  });

  // Replace with actual data
  const degreeOptions = ['Bachelor of Computing', 'Bachelor of Engineering', 'Bachelor of Science'];
  const majorOptions = ['Computer Science', 'Information Systems', 'Computer Engineering', 'Software Engineering'];
  const cohortOptions = ['2024/2025', '2025/2026', '2026/2027', '2027/2028', '2028/2029', '2029/2030'];
  
  const trackOptions = useMemo(() => 
    miniModuleData.map(module => ({
      code: module.code,
      title: module.title,
      label: `${module.code} - ${module.title}`
    })), []
  );

  const handleAddTrack = () => {
    setAdditionalTracks([...additionalTracks, null]);
  };

  const handleRemoveTrack = (index: number) => {
    if (additionalTracks.length > 1) {
      const newTracks = additionalTracks.filter((_, i) => i !== index);
      setAdditionalTracks(newTracks);
    }
  };

  const handleTrackChange = (index: number, value: { code: string; title: string; label: string; } | null) => {
    const newTracks = [...additionalTracks];
    newTracks[index] = value;
    setAdditionalTracks(newTracks);
  };

  const handleAddExemptedField = () => {
    setExemptedSearchFields([...exemptedSearchFields, null]);
  };

  const handleRemoveExemptedField = (index: number) => {
    if (exemptedSearchFields.length > 1) {
      const newFields = exemptedSearchFields.filter((_, i) => i !== index);
      setExemptedSearchFields(newFields);
    }
  };

  const handleExemptedFieldChange = (index: number, value: { code: string; title: string; label: string; } | null) => {
    const newFields = [...exemptedSearchFields];
    newFields[index] = value;
    setExemptedSearchFields(newFields);
  };

  const handleGenerate = async () => {
    const selectedModuleCodes = additionalTracks
      .filter(track => track !== null)
      .map(track => track!.code);
    
    const selectedExemptedCodes = exemptedSearchFields
      .filter(field => field !== null)
      .map(field => field!.code);
    
    if (selectedModuleCodes.length === 0) {
      console.warn('No modules selected for generation');
      return;
    }

    try {
      const result = await triggerGetTimetable({
        requiredModuleCodes: selectedModuleCodes,
        exemptedModuleCodes: selectedExemptedCodes
      }).unwrap();
      
    } catch (error) {
      console.error('Error generating timetable:', error);
    }
  };

  const isFormValid = additionalTracks.some(track => track !== null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Header */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          Generate Your Timetable
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Fill in your information below to generate an optimized course schedule
        </Typography>
      </Box>

      {/* Collapsible "Coming Soon" Section */}
      {/* <Box sx={{ 
        p: 1.5, 
        backgroundColor: 'action.hover', 
        borderRadius: 1,
        border: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <InfoOutlinedIcon fontSize="small" color="disabled" />
          <Typography variant="caption" color="text.secondary">
            Automatic degree requirements coming soon. For now, manually select your target modules below.
          </Typography>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Degree Program
          </Typography>
          <Autocomplete
            value={degree}
            onChange={(event, newValue) => setDegree(newValue)}
            options={degreeOptions}
            disabled
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select your..."
                size="small"
              />
            )}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Major
          </Typography>
          <Autocomplete
            value={major}
            onChange={(event, newValue) => setMajor(newValue)}
            options={majorOptions}
            disabled
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select your m..."
                size="small"
              />
            )}
          />
        </Box>

        <Box>
          <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block', color: 'text.secondary' }}>
            Cohort
          </Typography>
          <Autocomplete
            value={cohort}
            onChange={(event, newValue) => setCohort(newValue || '')}
            options={cohortOptions}
            disabled
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select cohort"
                size="small"
              />
            )}
          />
        </Box>
      </Box> */}

      {/* Target Modules */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Target Modules
          </Typography>
          <Button
            onClick={handleAddTrack}
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            sx={{ 
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1
            }}
          >
            Add Module
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Select the modules you want to include in your timetable
        </Typography>
        
        {additionalTracks.map((track, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 0.5, 
              mb: 1
            }}
          >
            <Autocomplete
              value={track}
              onChange={(event, newValue) => handleTrackChange(index, newValue)}
              options={trackOptions.filter(option => {
                // Filter out modules already selected in other target fields
                const selectedCodes = additionalTracks
                  .filter((t, i) => i !== index && t !== null)
                  .map(t => t!.code);
                // Also filter out exempted modules
                const exemptedCodes = exemptedSearchFields
                  .filter(f => f !== null)
                  .map(f => f!.code);
                return !selectedCodes.includes(option.code) && !exemptedCodes.includes(option.code);
              })}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                return option.code === value.code;
              }}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options.slice(0, 100);
                const filtered = options.filter(
                  option => 
                    option.code.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.title.toLowerCase().includes(inputValue.toLowerCase())
                );
                return filtered.slice(0, 50);
              }}
              blurOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by mod..."
                  size="small"
                />
              )}
              sx={{ flex: 1 }}
            />
            {additionalTracks.length > 1 && (
              <IconButton
                onClick={() => handleRemoveTrack(index)}
                size="small"
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.lighter',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}

        {!isFormValid && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            mt: 1,
            p: 1,
            backgroundColor: 'info.lighter',
            borderRadius: 1
          }}>
            <InfoOutlinedIcon fontSize="small" color="info" />
            <Typography variant="caption" color="info.main">
              Select at least one module to generate your timetable
            </Typography>
          </Box>
        )}
      </Box>

      {/* Exempted Modules */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Exempted Modules
          </Typography>
          <Button
            onClick={handleAddExemptedField}
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            sx={{ 
              textTransform: 'none',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 1
            }}
          >
            Add Module
          </Button>
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Modules you've already completed or want to exclude from your timetable
        </Typography>
        
        {/* Dynamic search fields for adding exempted modules */}
        {exemptedSearchFields.map((field, index) => (
          <Box 
            key={index} 
            sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: 0.5, 
              mb: 1
            }}
          >
            <Autocomplete
              value={field}
              onChange={(event, newValue) => handleExemptedFieldChange(index, newValue)}
              options={trackOptions.filter(option => {
                // Filter out modules already selected in other exempted fields
                const selectedCodes = exemptedSearchFields
                  .filter((f, i) => i !== index && f !== null)
                  .map(f => f!.code);
                // Also filter out target modules
                const targetCodes = additionalTracks
                  .filter(t => t !== null)
                  .map(t => t!.code);
                return !selectedCodes.includes(option.code) && !targetCodes.includes(option.code);
              })}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return option === value;
                return option.code === value.code;
              }}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options.slice(0, 100);
                const filtered = options.filter(
                  option => 
                    option.code.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.title.toLowerCase().includes(inputValue.toLowerCase())
                );
                return filtered.slice(0, 50);
              }}
              blurOnSelect
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search by mod..."
                  size="small"
                />
              )}
              sx={{ flex: 1 }}
            />
            {exemptedSearchFields.length > 1 && (
              <IconButton
                onClick={() => handleRemoveExemptedField(index)}
                size="small"
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'error.lighter',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
        
        {exemptedSearchFields.every(field => field === null) && (
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
            No exempted modules. Add modules above to exclude them from your timetable.
          </Typography>
        )}
      </Box>

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
          p: 1,
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