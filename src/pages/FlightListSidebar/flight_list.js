import React, {useState} from 'react';
import {Box, Grid } from '@mui/material';
import FlightAccordion from '../../components/FlightAccordion';

const FlightList = ({sendData, flightList}) => {
    
    const [flightDict, setFlightDict] = useState(flightList);
    
    const clickFlightID = (event) => {
        const flight_id = event.target.id;
        sendData(flightDict[flight_id]);
    }
    
    return (
        <Grid item xs={12} sm={12} md={12} lg={12} style={{
             overflow: 'auto',
             height: '100%',
        }}>
            {Object.entries(flightDict).length > 0 &&
                Object.entries(flightDict).map(([flight_id, value]) => {
                return (
                    <Box sx={{padding: '3px'}}>
                        <FlightAccordion flightDetails={value} onClick={clickFlightID} />
                    </Box>
                );
            })}
            
        </Grid>
    );
};
export default FlightList;