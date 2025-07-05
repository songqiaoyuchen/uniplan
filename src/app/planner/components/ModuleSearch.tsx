"use client";

import { useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { Autocomplete, Box, TextField } from "@mui/material";
import moduleData from "@/data/miniModuleData.json";
import { useDispatch, useSelector } from "react-redux";
import { fetchModule } from "@/services/planner/fetchModule";
import { MiniModuleData } from "@/types/plannerTypes";
import { addFetchedModule, setActiveModule } from "@/store/plannerSlice";
import SearchIcon from '@mui/icons-material/Search';
import { InputAdornment } from '@mui/material'
import { RootState } from "@/store";
import { useRouter } from 'next/navigation';

const ModuleSearch = () => {
  const modules = useSelector((state: RootState) => state.planner.modules);
  const fetchedModules = useSelector((state: RootState) => state.planner.fetchedModules);
  const dispatch = useDispatch();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [value, setValue] = useState<MiniModuleData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // for blurring

  const fuse = useMemo(() => {
    return new Fuse<MiniModuleData>(moduleData, {
      keys: ["code", "title"],
      threshold: 0.3,
    });
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).map((r) => r.item).slice(0, 15);
  }, [fuse, query]);

  const handleSearch = async (_: any, mod: MiniModuleData | null) => {
    if (!mod) return;

    // If module already exists in modules or fetchedModules, do not fetch
    if (modules[mod.code] || fetchedModules[mod.code]) {
      dispatch(setActiveModule(mod.code));
      setQuery("");
      setValue(null);
      if (inputRef.current) {
        inputRef.current.blur();
      }
      return;
    }

    try {
      // Clear both input and selected value
      setQuery("");
      setValue(null);

      const module = await fetchModule(mod.code);
      console.log("Fetched module:", module);

      // Save to fetchedModules if not already in modules
      if (!modules[module.code]) {
        dispatch(addFetchedModule(module));
      }

      dispatch(setActiveModule(module.code));
      router.push(`?module=${mod.code}`, { scroll: false });

      // Blur the input manually
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  return (
    <Autocomplete
      sx={{ width: "100%"}}
      open={Boolean(query.trim())} 
      options={results}
      noOptionsText="No matching modules"
      getOptionLabel={(mod) => `${mod.code} ${mod.title}`}
      inputValue={query}
      value={value}
      onInputChange={(_, val) => setQuery(val)}
      onChange={handleSearch}
      popupIcon={null}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder="Search for modules..."
          variant="outlined"
          inputRef={inputRef}
          sx={{
            width: '100%',
            '& .MuiOutlinedInput-root': {
              borderRadius: '9999px',
              '& fieldset': {
                borderColor: 'primary.main',
              },
              '&:hover fieldset': {
                borderColor: 'primary.light',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            },
          }}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Box
                    sx={{
                      backgroundColor: 'primary.main',
                      borderRadius: '50%',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SearchIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                </InputAdornment>
              ),
            }
          }}

        />
      )}
      disablePortal
      clearOnBlur={true}
    />
  );
};

export default ModuleSearch;
