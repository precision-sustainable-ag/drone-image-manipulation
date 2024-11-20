import React, {useState} from 'react';
import {Button, Grid } from '@mui/material';

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
                <Button key={flight_id} id={flight_id} onClick={clickFlightID}>{value['display_name']}
                </Button>
                );
            })}
            
        </Grid>
    );
};
export default FlightList;