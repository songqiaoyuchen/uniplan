import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useAppDispatch, useAppSelector } from "@/store";
import { verticalViewToggled } from "@/store/timetableSlice";

const Settings: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isVerticalView } = useAppSelector((state: any) => state.timetable);

    // Handle orientation change
    const handleOrientationChange = (
        event: React.MouseEvent<HTMLElement>,
        newOrientation: string | null,
    ) => {
        if (newOrientation !== null) {
            const shouldBeVertical = newOrientation === 'vertical';
            if (shouldBeVertical !== isVerticalView) {
                dispatch(verticalViewToggled());
            }
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Timetable Layout
            </Typography>
            
            <ToggleButtonGroup
                value={isVerticalView ? 'vertical' : 'horizontal'}
                exclusive
                onChange={handleOrientationChange}
                aria-label="layout orientation"
                sx={{ 
                    width: '100%',
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        py: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            }
                        },
                        '&:not(.Mui-selected)': {
                            opacity: 0.6,
                            backgroundColor: 'background.paper',
                            color: 'text.secondary',
                            '&:hover': {
                                opacity: 0.8,
                                backgroundColor: 'action.hover',
                            }
                        }
                    }
                }}
            >
                <ToggleButton value="vertical" aria-label="vertical layout">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <ViewColumnIcon />
                        <Typography variant="body2">
                            Vertical
                        </Typography>
                    </Box>
                </ToggleButton>
                <ToggleButton value="horizontal" aria-label="horizontal layout">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <ViewStreamIcon />
                        <Typography variant="body2">
                            Horizontal
                        </Typography>
                    </Box>
                </ToggleButton>
            </ToggleButtonGroup>
        </Box>
    )
};

export default Settings;
