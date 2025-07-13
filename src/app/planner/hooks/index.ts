import { useMemo } from 'react';
import { useAppSelector } from '@/store'; 
import { makeIsModulePlannedSelector, makeIsModuleSelectedSelector, makeIsSemesterDraggedOverSelector, makeSelectModuleCodesBySemesterId, makeSelectModuleStatusByCode } from '@/store/timetableSelectors';
import { useGetModuleByCodeQuery } from '@/store/apiSlice';
import { ModuleData } from '@/types/plannerTypes';

export const useModuleState = (moduleCode: string | null) => {
  // ModuleData
  const {
    data: staticData,
    isLoading,
    isError,
  } = useGetModuleByCodeQuery(moduleCode!, {
    skip: moduleCode === null,
  });

  const selectModuleStatus = useMemo(
    () => (moduleCode ? makeSelectModuleStatusByCode(moduleCode)
    : () => null),
  [moduleCode]);

  const moduleStatus = useAppSelector(selectModuleStatus);

  const module = useMemo<ModuleData | null>(() => {
    if (!staticData) {
      return null;
    }
    if (!moduleStatus) {
      return staticData
    }
    return {
      ...staticData,
      status: moduleStatus,
    };
  }, [staticData, moduleStatus]);

  // selected state
  const isModuleSelectedSelector = useMemo(() => (moduleCode 
    ? makeIsModuleSelectedSelector(moduleCode) 
    : () => false), 
  [moduleCode]);
  const isSelected = useAppSelector(isModuleSelectedSelector);

  // planned state
  const isModulePlannedSelector = useMemo(() => ( moduleCode
    ? makeIsModulePlannedSelector(moduleCode)
    : () => false), 
  [moduleCode]);
  const isPlanned = useAppSelector(isModulePlannedSelector);

  return {
    module,
    isLoading,
    isError,
    isSelected,
    isPlanned
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
