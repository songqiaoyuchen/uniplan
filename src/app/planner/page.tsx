// src/app/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setModules } from '@/store/plannerSlice';
import PlannerContainer from './components/PlannerContainer';
import { PlannerModule } from '@/types/plannerTypes';

const dummyModules: PlannerModule[] = [
  { id: '1', code: 'CS1101S', title: 'Programming Methodology', credits: 4, semestersOffered: 0, exam: { startTime: '2025-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1 },
  { id: '2', code: 'MA1521', title: 'Calculus', credits: 4, semestersOffered: 1, exam: { startTime: '2025-12-02T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1 },
  { id: '3', code: 'IS1108', title: 'Digital Ethics', credits: 4, semestersOffered: 2, exam: { startTime: '2026-05-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 2 },
  { id: '4', code: 'CS1231S', title: 'Discrete Structures', credits: 4, semestersOffered: 0, exam: { startTime: '2025-12-05T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 1 },
  { id: '5', code: 'CS2030S', title: 'OOP', credits: 4, semestersOffered: 1, exam: { startTime: '2026-05-07T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 2 },
  { id: '6', code: 'CS2040S', title: 'Data Structures', credits: 4, semestersOffered: 1, exam: { startTime: '2026-05-09T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 2 },
  { id: '7', code: 'ST2334', title: 'Probability and Statistics', credits: 4, semestersOffered: 2, exam: { startTime: '2026-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 3 },
  { id: '8', code: 'CS2100', title: 'Computer Organisation', credits: 4, semestersOffered: 0, exam: { startTime: '2026-12-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 3 },
  { id: '9', code: 'CS2103T', title: 'Software Engineering', credits: 4, semestersOffered: 2, exam: { startTime: '2027-05-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 4 },
  { id: '10', code: 'CS2106', title: 'Operating Systems', credits: 4, semestersOffered: 0, exam: { startTime: '2027-05-03T14:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 4 },
  { id: '11', code: 'GEA1000', title: 'Quantitative Reasoning', credits: 4, semestersOffered: 1, exam: { startTime: '2027-12-01T09:00:00Z', durationMinutes: 120 }, preclusions: [], plannedSemester: 5 },
  { id: '12', code: 'CFG1002', title: 'Career Catalyst', credits: 2, semestersOffered: 1, exam: null, preclusions: [], plannedSemester: 6 },
];

export default function Page() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setModules(dummyModules));
  }, [dispatch]);

  return (
    <main>
      <PlannerContainer />
    </main>
  );
}
