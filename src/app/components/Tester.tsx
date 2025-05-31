import React, { useState } from 'react';
import { formatGraph } from '@/utils/graph/formatGraph';
import { fetchRawGraph } from '@/services/planner/fetchGraph';

const rawGraph = await fetchRawGraph(["CS3230"]);

export default function TestFormatGraph() {
  const [formatted, setFormatted] = useState<string | null>(null);

  const handleClick = () => {
    const result = formatGraph(rawGraph);
    setFormatted(JSON.stringify(result, null, 2));
  };

  return (
    <div>
      <button onClick={handleClick}>Format Graph</button>
      {formatted && (
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto', backgroundColor: '#f0f0f0', padding: '1rem' }}>
          {formatted}
        </pre>
      )}
    </div>
  );
}
