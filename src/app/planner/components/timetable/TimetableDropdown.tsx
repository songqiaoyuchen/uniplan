// components/TimetableDropdown.tsx
import * as React from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { switchTimetable } from "@/store/plannerSlice"; // thunk
import {
  timetableAdded,
  timetableRemoved,
  timetableUpdated,
} from "@/store/plannerSlice";
import type { Timetable } from "@/store/plannerSlice";
import type { ModuleData } from "@/types/plannerTypes";
import type { EntityState } from "@reduxjs/toolkit";
import { cloneEntityState } from "@/utils/cloneEntityState";

const TimetableDropdown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const activeName = useSelector(
    (state: RootState) => state.planner.activeTimetableName
  );
  const allIds = useSelector(
    (state: RootState) => state.planner.timetables.ids
  ) as string[];
  const allEntities = useSelector(
    (state: RootState) => state.planner.timetables.entities
  ) as Record<string, Timetable | undefined>;

  const timetables: Timetable[] = React.useMemo(
    () => allIds.map((id) => allEntities[id]).filter(Boolean) as Timetable[],
    [allIds, allEntities]
  );

  // anchor
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // helpers
  const existingNames = React.useMemo(() => new Set(allIds), [allIds]);
  const uniqueName = (base: string) => {
    if (!existingNames.has(base)) return base;
    let i = 2;
    while (existingNames.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  };

  const onSwitch = (name: string) => {
    if (name !== activeName) {
      dispatch(switchTimetable(name));
    }
    handleClose();
  };

  const onCreateEmpty = () => {
    const name = uniqueName("New Timetable");
    dispatch(timetableAdded({ name }));     // create empty
    dispatch(switchTimetable(name));        // save current → set active → load new
    handleClose();
  };

  const onDuplicate = (nameToCopy: string) => {
    const src = allEntities[nameToCopy];
    if (!src) return;
    const dupName = uniqueName(`${nameToCopy} Copy`);
    dispatch(timetableAdded({ name: dupName })); // empty record
    dispatch(
      timetableUpdated({
        name: dupName,
        modules: cloneEntityState<ModuleData>(src.modules as EntityState<ModuleData, string>),
        semesters: cloneEntityState(src.semesters),
      })
    );
    dispatch(switchTimetable(dupName));
    handleClose();
  };

  const onDelete = (nameToDelete: string) => {
    if (nameToDelete === activeName) return;
    dispatch(timetableRemoved(nameToDelete));
    handleClose();
  };

  return (
    <>
      <Tooltip title="Switch / manage timetables">
        <IconButton size="small" onClick={handleOpen}>
          <ArrowDropDownIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { minWidth: 280 } }}
      >
        {timetables.map((tt) => {
          const name = tt.name;
          const isActive = name === activeName;
          return (
            <MenuItem
              key={name}
              dense
              onClick={() => onSwitch(name)}
              selected={isActive}
              sx={{ gap: 1 }}
            >
              <ListItemText
                primary={name}
                primaryTypographyProps={{
                  noWrap: true,
                  fontWeight: isActive ? 600 : 400,
                }}
              />
              <Tooltip title="Duplicate">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(name);
                  }}
                >
                  <ContentCopyIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title={isActive ? "Cannot delete active timetable" : "Delete"}>
                <span>
                  <IconButton
                    edge="end"
                    size="small"
                    disabled={isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(name);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>
            </MenuItem>
          );
        })}

        <Divider sx={{ my: 0.5 }} />

        <MenuItem dense onClick={onCreateEmpty} sx={{ gap: 1 }}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Create new timetable" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default TimetableDropdown;
