// components/TimetableDropdown.tsx
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
} from "@mui/material";
import { Snackbar, Alert } from "@mui/material";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import ShareIcon from "@mui/icons-material/Share";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { switchTimetable, timetableImported } from "@/store/plannerSlice"; // thunk
import {
  timetableAdded,
  timetableRemoved,
  timetableUpdated,
} from "@/store/plannerSlice";
import type { Timetable } from "@/store/plannerSlice";
import type { ModuleData, TimetableSnapshot } from "@/types/plannerTypes";
import type { EntityState } from "@reduxjs/toolkit";
import { cloneEntityState } from "@/utils/cloneEntityState";
import { serializeTimetable } from "@/utils/planner/shareTimetable";
import { moduleTagsUpdated, semestersAdapter, updateModuleStates } from "@/store/timetableSlice";
import { useMemo, useState } from "react";
import ImportTimetableDialog from "./ImportTimetableDialog";
import { apiSlice } from "@/store/apiSlice";

const TimetableDropdown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // timetable tabs
  const activeName = useSelector(
    (state: RootState) => state.planner.activeTimetableName
  );
  const allIds = useSelector(
    (state: RootState) => state.planner.timetables.ids
  ) as string[];
  const allEntities = useSelector(
    (state: RootState) => state.planner.timetables.entities
  ) as Record<string, Timetable | undefined>;

  const timetables: Timetable[] = useMemo(
    () => allIds.map((id) => allEntities[id]).filter(Boolean) as Timetable[],
    [allIds, allEntities]
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const existingNames = useMemo(() => new Set(allIds), [allIds]);
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
    dispatch(timetableAdded({ name: dupName }));
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

  // export / share
  const onShare = async (name: string) => {
    const tt = allEntities[name];
    if (!tt) return;

    try {
      const snapshot = serializeTimetable(tt.modules, tt.semesters);

      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) throw new Error("Failed to create snapshot");

      const { id } = await res.json();
      const url = `${window.location.origin}/planner/import?id=${id}`;

      await navigator.clipboard.writeText(url);
      showSnackbar("Share link copied to clipboard", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to share timetable", "error");
    }
  };

  // import / load
  const [importOpen, setImportOpen] = useState(false);

  function extractSnapshotId(input: string): string | null {
    const trimmed = input.trim();

    // Case 1: looks like a raw ID
    if (/^[a-zA-Z0-9_-]{6,}$/.test(trimmed)) {
      return trimmed;
    }

    // Case 2: try parsing as URL
    try {
      const url = new URL(trimmed);
      return url.searchParams.get("id");
    } catch {
      return null;
    }
  }

const onImport = async (input: string) => {
  const id = extractSnapshotId(input);

  if (!id) {
    showSnackbar("Invalid link or snapshot ID", "error");
    return;
  }

  try {
    // fetch snapshot
    const res = await fetch(`/api/snapshot/${id}`);
    if (!res.ok) throw new Error("Snapshot not found");

    const snapshot: TimetableSnapshot = await res.json();
    if (snapshot.version !== 1) throw new Error("Unsupported snapshot version");

    const name = uniqueName("Imported Timetable");

    // extract all module codes from snapshot
    const allModuleCodes = Array.from(
      new Set(snapshot.semesters.flatMap((s) => s))
    );

    // fetch full module data for all codes
    const moduleDataResults = await Promise.all(
      allModuleCodes.map((code) =>
        dispatch(
          apiSlice.endpoints.getModuleByCode.initiate(code, { forceRefetch: true })
        )
      )
    );

    // filter out any null/undefined results
    const modules: ModuleData[] = moduleDataResults
      .map((res) => ("data" in res ? res.data : undefined))
      .filter(Boolean) as ModuleData[];

    // dispatch timetableImported
    dispatch(
      timetableImported({
        name,
        snapshot,
        modules,
      })
    );

    // apply tags from snapshot
    Object.entries(snapshot.tags).forEach(([code, tags]) => {
      dispatch(moduleTagsUpdated({ code, tags }));
    });

    showSnackbar("Timetable imported successfully", "success");
  } catch (err) {
    console.error(err);
    showSnackbar("Failed to import timetable", "error");
  } finally {
    setImportOpen(false);
    handleClose();
  }
};

  type SnackbarState = {
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  };

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: SnackbarState["severity"]
  ) => {
    setSnackbar({ open: true, message, severity });
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
        slotProps={{ paper: { sx: { minWidth: 320 } } }}
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
                slotProps={{ primary: {
                  noWrap: true,
                  fontWeight: isActive ? 600 : 400,
                }}} />
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
              <Tooltip title="Share">
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(name);
                  }}
                >
                  <ShareIcon fontSize="inherit" />
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

        <MenuItem
          dense
          onClick={() => {
            setImportOpen(true);
            handleClose();
          }}
          sx={{ gap: 1 }}
        >
          <ListItemIcon>
            <FileUploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Import timetable" />
        </MenuItem>
      </Menu>
      <ImportTimetableDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onConfirm={onImport}
      />

      {/* notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TimetableDropdown;
