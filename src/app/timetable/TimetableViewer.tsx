'use client';

import { useState } from 'react';
import { TimetableData } from '@/types/graphTypes';

export default function TimetableViewer() {
  const [targetModules, setTargetModules] = useState('');
  const [timetable, setTimetable] = useState<TimetableData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTimetable = async () => {
    if (!targetModules.trim()) {
      setError('Please enter at least one module code');
      return;
    }

    setLoading(true);
    setError(null);
    setTimetable(null);

    try {
      const params = new URLSearchParams({
        targetModuleCodes: targetModules.trim()
      });

      const response = await fetch(`/api/timetable?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate timetable');
      }

      setTimetable(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Group timetable by semester
  const groupedBySemester = timetable?.reduce((acc, item) => {
    if (!acc[item.semester]) {
      acc[item.semester] = [];
    }
    acc[item.semester].push(item);
    return acc;
  }, {} as Record<number, TimetableData[]>);

  // Calculate statistics
  const stats = timetable ? {
    totalModules: timetable.length,
    totalSemesters: Object.keys(groupedBySemester || {}).length,
    avgModulesPerSem: (timetable.length / Object.keys(groupedBySemester || {}).length).toFixed(1),
    totalMCs: timetable.reduce((sum, item) => sum + 4, 0) // Assuming 4 MCs per module
  } : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Module Scheduler Viewer</h1>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Target Modules</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={targetModules}
            onChange={(e) => setTargetModules(e.target.value)}
            placeholder="e.g., CS2030S, CS2040S, CS3230"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && generateTimetable()}
          />
          <button
            onClick={generateTimetable}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Schedule'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Enter module codes separated by commas
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">
          {error}
        </div>
      )}

      {/* Results Section */}
      {timetable && !loading && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalModules}</div>
              <div className="text-sm text-gray-600">Total Modules</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.totalSemesters}</div>
              <div className="text-sm text-gray-600">Semesters</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.avgModulesPerSem}</div>
              <div className="text-sm text-gray-600">Avg Modules/Sem</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{stats?.totalMCs}</div>
              <div className="text-sm text-gray-600">Total MCs</div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Semester Timeline</h2>
            <div className="space-y-6">
              {Object.entries(groupedBySemester || {})
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([semester, modules]) => (
                  <div key={semester} className="flex gap-4">
                    <div className="flex-none w-24">
                      <div className="bg-gray-100 rounded-lg px-3 py-2 text-center">
                        <div className="text-sm text-gray-600">Semester</div>
                        <div className="text-lg font-bold">{semester}</div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        {modules.map((module) => (
                          <div
                            key={`${semester}-${module.code}`}
                            className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md font-medium"
                          >
                            {module.code}
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {modules.length} modules • {modules.length * 4} MCs
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}