import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useMemo } from 'react';
import miniModuleData from '@/data/miniModuleData.json';
import { useLazyGetTimetableQuery } from '@/store/apiSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { exemptedModuleAdded, exemptedModuleRemoved } from '@/store/timetableSlice';


const Generate: React.FC = () => {
  const [degree, setDegree] = useState<string | null>(null);
  const [major, setMajor] = useState<string | null>(null);
  const [cohort, setCohort] = useState<string>('');
  const [additionalTracks, setAdditionalTracks] = useState<Array<{ code: string; title: string; label: string; } | null>>([null]);
  
  const dispatch = useDispatch();
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

  const handleGenerate = async () => {
    const selectedModuleCodes = additionalTracks
      .filter(track => track !== null)
      .map(track => track!.code);
    
    if (selectedModuleCodes.length === 0) {
      console.warn('No modules selected for generation');
      return;
    }

    try {
      const result = await triggerGetTimetable({
        requiredModuleCodes: selectedModuleCodes,
        exemptedModuleCodes: exemptedModuleCodes
      }).unwrap();
      
    } catch (error) {
      console.error('Error generating timetable:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        Generate Timetable
      </Typography>

      {/* 1) Degree */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          1) Degree (Not implemented yet)
        </Typography>
        <Autocomplete
          value={degree}
          onChange={(event, newValue) => setDegree(newValue)}
          options={degreeOptions}
          disabled // Not implemented yet
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select your degree"
              size="small"
            />
          )}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* 2) Major */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          2) Major (Not implemented yet)
        </Typography>
        <Autocomplete
          value={major}
          onChange={(event, newValue) => setMajor(newValue)}
          options={majorOptions}
          disabled // Not implemented yet
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select your major"
              size="small"
            />
          )}
          sx={{ width: '100%' }}
        />
      </Box>

      {/* 3) Cohort */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
          3) Cohort (Not implemented yet)
        </Typography>
        <FormControl size="small" sx={{ width: '100%' }} disabled>
          <InputLabel>Select your cohort</InputLabel>
          <Select
            value={cohort}
            onChange={(event) => setCohort(event.target.value)}
            label="Select your cohort"
          >
            {cohortOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 4) Additional Tracks/Target Modules */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            4) Additional Target Modules (Tracks not implemented yet)
          </Typography>
          <IconButton
            onClick={handleAddTrack}
            size="small"
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {additionalTracks.map((track, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Autocomplete
              value={track}
              onChange={(event, newValue) => handleTrackChange(index, newValue)}
              options={trackOptions}
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type to search modules..."
                  size="small"
                  helperText="Type module code or name to search"
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
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                  },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>

      {/* 5) Exempted Modules */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            5) Exempted Modules
          </Typography>
        </Box>
        
        {/* Show selected exempted modules from Redux store */}
        {exemptedModuleCodes && exemptedModuleCodes.length > 0 && (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Exempted Modules:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {exemptedModuleCodes.join(', ')}
            </Typography>
          </Box>
        )}
        
        {/* Add exempted module autocomplete */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Autocomplete
            value={null}
            onChange={(event, newValue) => {
              if (newValue && !exemptedModuleCodes.includes(newValue.code)) {
                dispatch(exemptedModuleAdded(newValue.code));
              }
            }}
            options={trackOptions.filter(option => !exemptedModuleCodes.includes(option.code))}
            getOptionLabel={(option) => option.label}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options.slice(0, 100);
              const filtered = options.filter(
                option => 
                  option.code.toLowerCase().includes(inputValue.toLowerCase()) ||
                  option.title.toLowerCase().includes(inputValue.toLowerCase())
              );
              return filtered.slice(0, 50);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Type to search modules to exempt..."
                size="small"
                helperText="Modules you have taken elsewhere or want to skip"
              />
            )}
            sx={{ flex: 1 }}
          />
        </Box>
        
        {/* Show exempted modules with remove buttons */}
        {exemptedModuleCodes && exemptedModuleCodes.map((moduleCode) => (
          <Box key={moduleCode} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="body2" sx={{ 
              flex: 1, 
              p: 1, 
              backgroundColor: 'action.hover', 
              borderRadius: 1,
              border: 1,
              borderColor: 'divider'
            }}>
              {moduleCode}
            </Typography>
            <IconButton
              onClick={() => dispatch(exemptedModuleRemoved(moduleCode))}
              size="small"
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* Generate Button */}
      <Button
        variant="contained"
        onClick={handleGenerate}
        size="large"
        sx={{
          mt: 2,
          py: 1.5,
          fontWeight: 600,
          textTransform: 'none',
        }}
        disabled={additionalTracks.every(track => track === null) || isFetching}
      >
        {isFetching ? 'Generating Timetable...' : 'Generate Timetable'}
      </Button>
      
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1, textAlign: 'center' }}>
          Error generating timetable. Please try again.
        </Typography>
      )}
    </Box>
  );
};

export default Generate;
