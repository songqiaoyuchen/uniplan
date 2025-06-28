// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setModules } from '@/store/plannerSlice';
import PlannerContainer from './components/PlannerContainer';
import { ModuleData, ModuleStatus } from '@/types/plannerTypes';
import { RootState } from '@/store';

const dummyModules: ModuleData[] = [
  {
    id: '1123', code: 'CS1101S', title: 'Advanced technologies in immune therapeutic development', credits: 4, semestersOffered: 0, exam: { startTime: '2025-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 0,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '212312', code: 'MA1521', title: 'Calculus', credits: 4, semestersOffered: 1, exam: { startTime: '2025-12-02T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 0,
    grade: undefined,
    status: ModuleStatus.Blocked
  },
  {
    id: '312312', code: 'IS1108', title: 'Digital Ethics', credits: 4, semestersOffered: 2, exam: { startTime: '2026-05-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1,
    grade: undefined,
    status: ModuleStatus.Locked
  },
  {
    id: '412312', code: 'CS1231S', title: 'Discrete Structures', credits: 4, semestersOffered: 0, exam: { startTime: '2025-12-05T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 0,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '5312312', code: 'CS2030S', title: 'OOP', credits: 4, semestersOffered: 1, exam: { startTime: '2026-05-07T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1,
    grade: undefined,
    status: ModuleStatus.Unlocked
  },
  {
    id: '6312312', code: 'CS2040S', title: 'Data Structures', credits: 4, semestersOffered: 1, exam: { startTime: '2026-05-09T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '7312312', code: 'ST2334', title: 'Probability and Statistics', credits: 4, semestersOffered: 2, exam: { startTime: '2026-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 2,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '31231238', code: 'CS2100', title: 'Computer Organisation', credits: 4, semestersOffered: 0, exam: { startTime: '2026-12-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 2,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '9123123', code: 'CS2103T', title: 'Software Engineering', credits: 4, semestersOffered: 2, exam: { startTime: '2027-05-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 4,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '1231310', code: 'CS2106', title: 'Operating Systems', credits: 4, semestersOffered: 0, exam: { startTime: '2027-05-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 4,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '1123131', code: 'GEA1000', title: 'Quantitative Reasoning', credits: 4, semestersOffered: 1, exam: { startTime: '2027-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 5,
    grade: undefined,
    status: ModuleStatus.Completed
  },
  {
    id: '1313130', code: 'CFG1002', title: 'Career Catalyst', credits: 2, semestersOffered: 1, exam: null, preclusions: [], plannedSemester: 6,
    grade: undefined,
    status: ModuleStatus.Completed
  },
];

export default function Page() {
  const dispatch = useDispatch();
  const modulesLoaded = useSelector((state: RootState) => Object.keys(state.planner.modules).length > 0);

  useEffect(() => {
    if (!modulesLoaded) {
      dispatch(setModules(dummyModules));
    }
  }, [dispatch, modulesLoaded]);

  return (
    <main>
      <PlannerContainer />
    </main>
  );
}
