'use client';

import { Box, Typography, Button } from "@mui/material";

export default function Home() {

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100vh', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Uni Planner
      </Typography>
    </Box>
  );
}