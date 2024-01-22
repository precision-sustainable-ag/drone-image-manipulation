import React, {useState,  useEffect} from 'react';
import {Button, Box, Grid, TextField, Typography} from '@mui/material';

const FlightList = ({sendData}) => {
    // const [flightList, setFlightList] = useState(['1','2']);
    const [flightDict, setFlightDict] = useState({});
    
    const clickFlightID = (event) => {
        console.log('click', event.target.id);
        const flight_id = event.target.id;
        // console.log(flightDict[flight_id]);
        sendData(flightDict[flight_id]);
    }

    useEffect(() => {
        fetch('http://localhost:5000/flight_list')
        .then((response) => {
            return response.json();
        })
        .then((data) => setFlightDict(data.flights))
        // .then((data) => setFlightList(data.flights))
        .catch((error) => console.log('error: ', error))
    }, []);
    
    return (
        <Grid item xs={12} sm={12} md={12} lg={12}>
            {Object.entries(flightDict).length > 0 &&
                Object.entries(flightDict).map(([flight_id, value]) => {
                return (
                <Button key={flight_id} id={flight_id} onClick={clickFlightID}>{value['display_name']}
                </Button>
                );
            })}
            {/* {flightList.map((flight_info, index) => (
                <Button id={flight_info['flight_id']}>{flight_info['display_name']}</Button>
            ))} */}
            
        </Grid>
    );
};
export default FlightList;