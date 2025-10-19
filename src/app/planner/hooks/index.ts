import { useMemo } from 'react';
import { useAppSelector } from '@/store'; 
import { makeIsModulePlannedSelector, makeIsModuleSelectedSelector, makeIsSemesterDraggedOverSelector, makeSelectModuleCodesBySemesterId, makeSelectModuleStateByCode } from '@/store/timetableSelectors';
import { useGetModuleByCodeQuery } from '@/store/apiSlice';
import { ModuleData, ModuleStatus } from '@/types/plannerTypes';
import { useTheme } from '@mui/material';

export const useModuleState = (moduleCode: string | null) => {
  // 1. Fetch static data (RTK Query)
  const {
    data: staticData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetModuleByCodeQuery(moduleCode!, {
    skip: moduleCode === null,
  });

  // 2. Memoized selectors
  const selectModuleState = useMemo(
    () => (moduleCode ? makeSelectModuleStateByCode(moduleCode) : () => null),
    [moduleCode]
  );
  const isModuleSelectedSelector = useMemo(
    () => (moduleCode ? makeIsModuleSelectedSelector(moduleCode) : () => false),
    [moduleCode]
  );
  const isModulePlannedSelector = useMemo(
    () => (moduleCode ? makeIsModulePlannedSelector(moduleCode) : () => false),
    [moduleCode]
  );

  // 3. Use selectors
  const moduleState = useAppSelector(selectModuleState);
  const isSelected = useAppSelector(isModuleSelectedSelector);
  const isPlanned = useAppSelector(isModulePlannedSelector);

  // 4. Merge static + dynamic state
  const module = useMemo<ModuleData | null>(() => {
    if (!staticData) return null;
    if (!moduleState) return staticData;
    return {
      ...staticData,
      status: moduleState.status,
      issues: moduleState.issues,
    };
  }, [staticData, moduleState]);

  return {
    module,
    isLoading,
    isFetching,
    isError,
    isSelected,
    isPlanned,
    refetch,
  };
};

export const useSemesterState = (semesterId: number) => {
  const selectModuleCodes = useMemo(() => makeSelectModuleCodesBySemesterId(semesterId), [semesterId]);
  const moduleCodes = useAppSelector(selectModuleCodes);

  const isDraggedOverSelector = useMemo(() => makeIsSemesterDraggedOverSelector(semesterId), [semesterId]);
  const isDraggedOver = useAppSelector(isDraggedOverSelector);

  return {
    moduleCodes,
    isDraggedOver,
  };
};

export function useModuleCardColors(status: ModuleStatus = ModuleStatus.Satisfied) {
  const theme = useTheme();

  const {
    backgroundColors,
    borderColors,
    selectedBorderWidth,
    selectedGlowWidth,
    selectedBorderColor,
  } = theme.palette.custom.moduleCard;

  return {
    backgroundColor: backgroundColors[status],
    borderColor: borderColors[status],
    selectedBorderWidth,
    selectedGlowWidth,
    selectedBorderColor,
  };
}


