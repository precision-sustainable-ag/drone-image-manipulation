import { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import GeoTIFFMap from './geotiffmap';
import {Button, Box, Grid, TextField, Typography} from '@mui/material';

function App() {
  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);

  const handleGridColsChange = (event) => {
    const newCols = parseInt(event.target.value, 10);
    setGridCols(newCols);
  };
  const handleGridRowsChange = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setGridRows(newRows);
  };
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
      <Grid
        style={{
          backgroundColor: 'rgba(240,247,235,.5)',
          // borderRadius: '10px',
          // border: '1px solid #598445',
          position: 'relative',
          width: '100%',
          // maxWidth: '500px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        mt={1}
      >
      <Grid item xs={12} sm={12} md={12} lg={12}>
        <Typography variant="h4" gutterBottom align="center">
        Cloud Optimized GeoTIFF (COG)
        </Typography>
      </Grid>
      
      <Grid item xs={12} sm={12} md={12} lg={12} marginBottom={'15px'}>
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
        {/* <Button
          variant="contained"
          color="primary"
          onClick={handleToggleGridDraw}
          style={{marginLeft:'5px'}}
        >Draw Grid</Button> */}
      </Grid>
      
      </Grid>
      <GeoTIFFMap gridCols={gridCols} gridRows={gridRows}/>
    </Box>
  );
}

export default App;
