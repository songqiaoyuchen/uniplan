// components/TimeTable.tsx
import React from 'react';
import { ModuleCell } from './ModuleCell';
import type { ScheduledModule } from '@/types';

interface TimeTableProps {
  modules: ScheduledModule[];
  rows: number;
  columns: number;
}

export const TimeTable: React.FC<TimeTableProps> = ({ modules, rows, columns }) => {
  // Create a 2D grid placeholder
  const grid: (ScheduledModule | null)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(null)
  );

  // Place modules into their scheduled positions
  modules.forEach((mod) => {
    if (grid[mod.row] && grid[mod.row][mod.column] === null) {
      grid[mod.row][mod.column] = mod;
    }
  });

  return (
    <div className="grid gap-4" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-12 gap-4">
          {row.map((mod, colIndex) => (
            <div key={colIndex} className="min-h-[100px]">
              {mod ? <ModuleCell module={mod} /> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
