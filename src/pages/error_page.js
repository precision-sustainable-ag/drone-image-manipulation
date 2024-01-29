import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { purple } from '@mui/material/colors';

// const primary = purple[500]; // #f44336
const primary = 'rgba(240,247,235,.5)';

export default function ErrorPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: primary,
      }}
    >
      <Typography variant="h1" >
        404
      </Typography>
      <Typography variant="h6">
        The page you’re looking for doesn’t exist.
      </Typography>
      <Button variant="contained">Back Home</Button>
    </Box>
  );
}