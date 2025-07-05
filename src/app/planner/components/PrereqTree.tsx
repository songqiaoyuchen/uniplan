'use client';

import { PrereqTree } from '@/types/plannerTypes';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MinModuleCard from './MinModuleCard';

interface PrereqTreeViewProps {
  prereqTree: PrereqTree;
}

const PrereqTreeView: React.FC<PrereqTreeViewProps> = ({ prereqTree }) => {
  switch (prereqTree.type) {
    case 'module':
      return <MinModuleCard moduleCode={prereqTree.moduleCode} />;

    case 'AND':
      return (
        <LogicalGroup title="All of the following are required:">
          {prereqTree.children.map((child, index) => (
            <PrereqTreeView key={index} prereqTree={child} />
          ))}
        </LogicalGroup>
      );

    case 'OR':
      return (
        <LogicalGroup title="At least one of the following is required:">
          {prereqTree.children.map((child, index) => (
            <PrereqTreeView key={index} prereqTree={child} />
          ))}
        </LogicalGroup>
      );

    case 'NOF':
      return (
        <LogicalGroup title={`At least ${prereqTree.n} of the following are required:`}>
          {prereqTree.children.map((child, index) => (
            <PrereqTreeView key={index} prereqTree={child} />
          ))}
        </LogicalGroup>
      );
      
    default:
      return null;
  }
};

// Helper component for styling the logical groups (AND, OR, NOF)
const LogicalGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        pl: 3, // Indentation for children
        py: 1,
        // Creates the vertical connector line
        '&:before': {
          content: '""',
          position: 'absolute',
          left: '8px',
          top: '28px',
          bottom: '16px',
          width: '2px',
          backgroundColor: 'divider',
        },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {children}
      </Box>
    </Box>
  );
};

export default PrereqTreeView;