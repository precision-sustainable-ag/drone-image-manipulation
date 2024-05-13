import React, {useState,  useEffect} from 'react';
import {Button, Box, Grid, TextField, Typography} from '@mui/material';
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
        <Grid spacing={2} xs={12} sm={12} md={12} lg={12} 
        align='right' backgroundColor='rgba(240,247,235,.5)'>
            <Button onClick={homeButton}>Home</Button>
            <Button onClick={feedBackButton}>Feeback</Button>
        </Grid>
    );
};
export default Header;