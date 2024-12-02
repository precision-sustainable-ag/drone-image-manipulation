import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const feedBackButton = async () => {
    navigate('/feedback');
  };
  const homeButton = async () => {
    navigate('/');
  };

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#E6F5DD",
        py: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <img
          src="/header-logo.png"
          alt="NC State Logo"
          style={{ width: "120px", height: "35px" }}
        />
        <Typography variant="h6" sx={{ color: "#516B42" }}>
          Site Title
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Button onClick={homeButton} sx={{ color: "#516B42" }}>
          Restart
        </Button>
        <Button onClick={feedBackButton} sx={{ color: "#516B42" }}>
          Feedback
        </Button>
      </Box>
    </Box>
  );
};
export default Header;