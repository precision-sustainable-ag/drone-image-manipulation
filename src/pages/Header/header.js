import React from 'react';
import {Button, Box} from '@mui/material';
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
        justifyContent: "flex-end",
        px: 2,
      }}
    >
      <Button onClick={homeButton}>Home</Button>
      <Button onClick={feedBackButton}>Feeback</Button>
    </Box>
    );
};
export default Header;