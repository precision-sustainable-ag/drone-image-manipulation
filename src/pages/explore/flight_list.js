import React, {useEffect, useState} from 'react';
import {Box, Grid } from '@mui/material';
import FlightAccordion from '../../components/FlightAccordion';

const FlightList = ({sendData, flightList}) => {
    
    const [flightDict, setFlightDict] = useState(flightList);
    const [selectedFlight, setSelectedFlight] = useState(null);

    useEffect(() => {
      // Sort in descending order of mission start time
      const sortedFlights = Object.entries(flightList).sort(
        ([, a], [, b]) =>
          new Date(b.mission_start_time) - new Date(a.mission_start_time)
      );

      const sortedFlightDict = Object.fromEntries(sortedFlights);
      setFlightDict(sortedFlightDict);
    }, [flightList]);

    useEffect(() => {
        sendData(selectedFlight);
    }, [selectedFlight]);
    
    return (
        <Grid item xs={12} sm={12} md={12} lg={12} style={{
             overflow: 'auto',
             height: '100%',
        }}>
            {Object.entries(flightDict).length > 0 &&
                Object.entries(flightDict).map(([flight_id, value]) => {
                return (
                    <Box key={flight_id} sx={{padding: '3px'}}>
                        <FlightAccordion
                            flightDetails={value}
                            expanded={selectedFlight?.flight_id === value.flight_id}
                            onClick={() => {
                            setSelectedFlight((prevSelected) =>
                                prevSelected?.flight_id === value.flight_id ? null : value
                            );
                            }}
                        />
                    </Box>
                );
            })}
            
        </Grid>
    );
};
export default FlightList;