// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveModule, setModules } from '@/store/plannerSlice';
import PlannerContainer from './components/PlannerContainer';
import { ModuleData, ModuleStatus, SemesterLabel } from '@/types/plannerTypes';
import { useSearchParams } from 'next/navigation';

const sampleTimetable: ModuleData[] = [
  {
    id: '1', code: 'CS1101S', title: 'Programming Methodology', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2025-12-01T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 0, grade: 'A', status: ModuleStatus.Completed,
    requires: null, unlocks: ['CS2030S', 'CS2040S']
  },
  {
    id: '2', code: 'MA1521', title: 'Calculus for Computing', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2025-12-02T14:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 0, grade: 'B+', status: ModuleStatus.Completed,
    requires: null, unlocks: ['CS1231S']
  },
  {
    id: '3', code: 'GEQ1000', title: 'Asking Questions', credits: 4,
    semestersOffered: [SemesterLabel.First, SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 0, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '4', code: 'CS1231S', title: 'Discrete Structures', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2026-05-03T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 1, status: ModuleStatus.Completed,
    requires: { type: 'module', moduleCode: 'MA1521' }, unlocks: ['CS2040S']
  },
  {
    id: '5', code: 'IS1103', title: 'Digital Ethics and Data Privacy', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 1, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '6', code: 'ST2334', title: 'Probability and Statistics', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2026-05-04T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 1, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '7', code: 'CS2030S', title: 'Programming Methodology II', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2026-12-01T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 2, status: ModuleStatus.Completed,
    requires: { type: 'module', moduleCode: 'CS1101S' }, unlocks: ['CS2100']
  },
  {
    id: '8', code: 'CS2040S', title: 'Data Structures and Algorithms', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2026-12-03T14:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 2, status: ModuleStatus.Completed,
    requires: { type: 'AND', children: [
      { type: 'module', moduleCode: 'CS1231S' },
      { type: 'module', moduleCode: 'CS1101S' }
    ]}, unlocks: ['CS2103T', 'CS3243']
  },
  {
    id: '9', code: 'GES1025', title: 'Global Studies: Sustainability', credits: 4,
    semestersOffered: [SemesterLabel.First, SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 2, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '10', code: 'CS2100', title: 'Computer Organisation', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2027-05-01T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 3, status: ModuleStatus.Completed,
    requires: { type: 'module', moduleCode: 'CS2030S' }, unlocks: ['CS2106']
  },
  {
    id: '11', code: 'CS2103T', title: 'Software Engineering', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2027-05-03T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 3, status: ModuleStatus.Completed,
    requires: { type: 'module', moduleCode: 'CS2040S' }, unlocks: ['CS4218', 'CS3219']
  },
  {
    id: '12', code: 'CS3243', title: 'Intro to Artificial Intelligence', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2027-05-05T14:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 3, status: ModuleStatus.Completed,
    requires: { type: 'module', moduleCode: 'CS2040S' }, unlocks: ['CS3244']
  },
  {
    id: '13', code: 'CS3230', title: 'Design & Analysis of Algorithms', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2027-12-01T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 4, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2040S' }, unlocks: []
  },
  {
    id: '14', code: 'CS3211', title: 'Parallel and Concurrent Programming', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2027-12-03T14:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 4, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2100' }, unlocks: []
  },
  {
    id: '15', code: 'IS2101', title: 'Business and Tech Communication', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 4, status: ModuleStatus.Unlocked,
    requires: null, unlocks: []
  },
  {
    id: '16', code: 'CS2106', title: 'Operating Systems', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2027-12-04T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 4, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2100' }, unlocks: []
  },
  {
    id: '17', code: 'CS3244', title: 'Machine Learning', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2028-05-04T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 5, status: ModuleStatus.Blocked,
    requires: { type: 'module', moduleCode: 'CS3243' }, unlocks: []
  },
  {
    id: '18', code: 'CS2105', title: 'Computer Networks', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2028-05-05T14:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 5, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2100' }, unlocks: []
  },
  {
    id: '19', code: 'CS4218', title: 'Software Testing', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: { startTime: '2028-05-06T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 6, status: ModuleStatus.Locked,
    requires: { type: 'module', moduleCode: 'CS2103T' }, unlocks: []
  },
  {
    id: '20', code: 'CS3219', title: 'Software Engineering Patterns', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: null,
    preclusions: [], plannedSemester: 7, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2103T' }, unlocks: []
  },
  {
    id: '21', code: 'CS3223', title: 'Database Systems Implementation', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2028-12-03T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 7, status: ModuleStatus.Unlocked,
    requires: { type: 'module', moduleCode: 'CS2100' }, unlocks: []
  },
  {
    id: '22', code: 'CFG1002', title: 'Career Catalyst', credits: 2,
    semestersOffered: [SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 3, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '23', code: 'PH1010', title: 'Philosophy and Reasoning', credits: 4,
    semestersOffered: [SemesterLabel.First],
    exam: { startTime: '2026-12-07T09:00:00Z', durationMinutes: 120 },
    preclusions: [], plannedSemester: 2, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  },
  {
    id: '24', code: 'UTC1700', title: 'University Town Seminar', credits: 4,
    semestersOffered: [SemesterLabel.Second],
    exam: null,
    preclusions: [], plannedSemester: 1, status: ModuleStatus.Completed,
    requires: null, unlocks: []
  }
];



export default function Page() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setModules(sampleTimetable));
  }, [dispatch]);

  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('module');
    if (code) {
      dispatch(setActiveModule(code));
    }
  }, [params, dispatch]);


  return (
    <main>
      <PlannerContainer />
    </main>
  );
}
