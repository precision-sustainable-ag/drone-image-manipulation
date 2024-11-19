import { useEffect, useState } from 'react';
import '../../styles/App.css';
import GeoTIFF from 'ol/source/GeoTIFF';
import FlightList from '../FlightListSidebar/flight_list';
import Header from '../Header/header';
import {Box, Button, Grid, Typography} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/MapComponent';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { RotateMap } from '../../components/MapControls';

function App() {

  const {state} = useLocation();
  const navigate = useNavigate();

  const [flightDetails, setFlightDetails] = useState('');
  const [vectorLayer, setVectorLayer] = useState(null);
  const [controls, setControls] = useState([]);

  const handleFlightDetailsUpdate = (newFlightDetails) => {
    setFlightDetails(newFlightDetails);
  };

  useEffect( () => {
    if (!flightDetails) return;

    const mapSource = new GeoTIFF({
      sources: [
        {
          url: process.env.REACT_APP_FILE_SERVER_URL+'/data/'+flightDetails.cog_path,
          // url: 'http://localhost:8080/cog.tif',
          crossOrigin: 'anonymous',
          // projection: 'EPSG:4326'
        },
      ],
    });
    const tileLayer = new WebGLTileLayer({source: mapSource});
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });
    const controls = [
      new RotateMap({ direction: "left" }),
      new RotateMap({ direction: "right" }),
    ];

    setVectorLayer([tileLayer, vectorLayer]);
    setControls(controls);
  }, [flightDetails]);

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
        <Header/>
        <Grid item xs={12} md={3} lg={2}
        style={{
          backgroundColor: 'rgba(240,247,235,.5)',
          position: 'relative',
          width: '100%',
          height: '657px',
          display: 'flex',
          flexDirection: 'column'
        }} mt={3}>
          <Grid>
            <Typography variant="h5" gutterBottom align="center">
              Flights
              </Typography>
          </Grid>
          <FlightList sendData={handleFlightDetailsUpdate} flightList={state}></FlightList>
        </Grid>

        {/* right side - header, rows/cols, map, etc */}
        <Grid item xs={12} md={9} lg={10}>
          <Grid style={{
              backgroundColor: 'rgba(240,247,235,.5)',
              position: 'relative',
              width: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            mt={1}>
            <MapComponent
            mapLayers={vectorLayer}
            controls={controls}
            mapSize={{ width: "100%", height: "500px" }}
          />
          </Grid>
          <Grid item xs={6} sm={6} md={6} lg={6} align="right" sx={{ mb: 1 }}>
            <Button
              onClick={() => {
                if (!flightDetails) {
                  alert("Select a flight to proceed");
                  return;
                }
                navigate("/draw-grid", {
                  state: { flightDetails },
                });
              }}
            >
              NEXT
            </Button>
          </Grid>
        </Grid>

      </Grid>    
    </Box>
  );
}

export default App;
