import { useState } from 'react';
import logo from '../../logo.svg';
import '../../styles/App.css';
import GeoTIFFMap from './geotiffmap';
import FlightList from '../FlightListSidebar/flight_list';
import {Button, Box, Grid, TextField, Typography} from '@mui/material';
import { useLocation } from 'react-router-dom';

function App() {

  const {state} = useLocation();
  // const {start_date, end_date, polygon_coordinates} = state;
  // console.log(start_date, end_date, polygon_coordinates);
  

  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);

  const [flightDetails, setFlightDetails] = useState('');

  const handleGridColsChange = (event) => {
    const newCols = parseInt(event.target.value, 10);
    setGridCols(newCols);
  };
  const handleGridRowsChange = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setGridRows(newRows);
  };
  const handleFlightDetailsUpdate = (newFlightDetails) => {
    setFlightDetails(newFlightDetails);
  }
  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100px'
      }}
      margin={5}
    >
      <Grid container spacing={2}>
        {/* left column */}
        <Grid item xs={12} md={3} lg={2}
        style={{
          backgroundColor: 'rgba(240,247,235,.5)',
          position: 'relative',
          width: '100%',
        }} mt={3}>
          <Grid>
            <Typography variant="h5" gutterBottom align="center">
              Flights
              </Typography>
          </Grid>
          <FlightList sendData={handleFlightDetailsUpdate} spatialQuery={state}></FlightList>
        </Grid>

        {/* right side - header, rows/cols, map, etc */}
        <Grid item xs={12} md={9} lg={10}>
          <Grid
          style={{
            backgroundColor: 'rgba(240,247,235,.5)',
            position: 'relative',
            width: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          mt={1}>

            <Grid item xs={12} sm={12} md={12} lg={12}>
              <Typography variant="h4" gutterBottom align="center">
              Cloud Optimized GeoTIFF (COG)
              </Typography>
            </Grid>
      
            <Grid item xs={12} sm={12} md={12} lg={12} marginBottom={'15px'} align="center">
              <TextField
                label='Cols'
                type='number'
                value={gridCols}
                onChange={handleGridColsChange}
                inputProps={{min:1}}
                size='small'
                style={{marginLeft:'10px', marginRight:'5px'}}
              />
              <TextField
                label='Rows'
                type='number'
                value={gridRows}
                onChange={handleGridRowsChange}
                inputProps={{min:1}}
                size='small'
                style={{marginLeft:'5px', marginRight:'5px'}}
              />
            </Grid>

          </Grid>
          <Grid style={{
              backgroundColor: 'rgba(240,247,235,.5)',
              position: 'relative',
              width: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            mt={1}>
            <GeoTIFFMap gridCols={gridCols} gridRows={gridRows} flightDetails={flightDetails}/>
          </Grid>
        </Grid>

      </Grid>    
    </Box>
  );
}

export default App;
