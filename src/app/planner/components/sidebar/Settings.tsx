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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header */}
            <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Timetable Layout
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Choose how your timetable is displayed
                </Typography>
            </Box>

            {/* Toggle Button Group */}
            <ToggleButtonGroup
                value={isVerticalView ? 'vertical' : 'horizontal'}
                exclusive
                onChange={handleOrientationChange}
                aria-label="layout orientation"
                sx={{ 
                    width: '100%',
                    '& .MuiToggleButtonGroup-grouped': {
                        border: 1,
                        borderColor: 'divider',
                        '&:not(:first-of-type)': {
                            marginLeft: 0,
                            borderLeft: 1,
                            borderLeftColor: 'divider'
                        },
                        '&:not(:last-of-type)': {
                            borderRight: 1,
                            borderRightColor: 'divider'
                        }
                    },
                    '& .MuiToggleButton-root': {
                        flex: 1,
                        py: 1.5,
                        textTransform: 'none',
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                            backgroundColor: 'primary.main',
                            color: 'primary.contrastText',
                            borderColor: 'primary.main !important',
                            '&:hover': {
                                backgroundColor: 'primary.dark',
                            }
                        },
                        '&:not(.Mui-selected)': {
                            backgroundColor: 'background.paper',
                            color: 'text.secondary',
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }
                    }
                }}
            >
                <ToggleButton value="vertical" aria-label="vertical layout">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <ViewColumnIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            Vertical
                        </Typography>
                    </Box>
                </ToggleButton>
                <ToggleButton value="horizontal" aria-label="horizontal layout">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <ViewStreamIcon fontSize="small" />
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            Horizontal
                        </Typography>
                    </Box>
                </ToggleButton>
            </ToggleButtonGroup>

        </Box>
    )
};

export default Settings;