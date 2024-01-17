import React, {useState,  useEffect} from 'react';
import {Button, Box, Grid, TextField, Typography} from '@mui/material';

const FlightList = () => {
    const [flightList, setFlightList] = useState(['1','2']);

    useEffect(() => {
        fetch('test.htnl')
        .then((response) => response.json())
        .then((data) => setFlightList(flightList))
        .catch((error) => console.log('error: ', error))
    }, []);

    return (
        <Grid item xs={12} sm={12} md={12} lg={12}>
            {flightList.map((flight_info, index) => (
                <Typography key={index} variant="h6" gutterBottom align="center">
                {flight_info}
                </Typography>
            ))}
            
        </Grid>
    );
};
export default FlightList;