// src/components/Timetable/ModuleCard.tsx
import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface ModuleCardProps {
  module: { id: string; code: string; title: string };
}

const ModuleCard: React.FC<ModuleCardProps> = ({ module }) => {
  return (
    <Card sx={{ backgroundColor: '#f5f5f5', cursor: 'pointer' }}>
      <CardContent>
        <Typography variant="subtitle1">{module.code}</Typography>
        <Typography variant="body2" color="textSecondary">{module.title}</Typography>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
