// components/ModuleCell.tsx
import React from 'react';
import type { ScheduledModule } from '@/types';

interface ModuleCellProps {
  module: ScheduledModule;
}

export const ModuleCell: React.FC<ModuleCellProps> = ({ module }) => {
  return (
    <div className="bg-white rounded-xl shadow p-3 border border-gray-300 text-sm">
      <div className="font-semibold">{module.code}</div>
      <div className="text-xs text-gray-600">{module.title}</div>
      <div className="text-[10px] mt-1 text-gray-400">
        ↗ {module.parents.length} ← {module.children.length}
      </div>
    </div>
  );
};
