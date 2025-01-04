import { useEffect, useState } from 'react';
import '../../styles/App.css';
import GeoTIFF from 'ol/source/GeoTIFF';
import FlightList from './flight_list';
import Header from "../../components/Header";
import {Box, Typography} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/MapComponent';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { RotateMap } from '../../components/MapControls';
import Footer from "../../components/Footer";

function Explore() {

  const {state} = useLocation();
  const navigate = useNavigate();

  const [flightDetails, setFlightDetails] = useState('');
  const [vectorLayer, setVectorLayer] = useState(null);
  const [controls, setControls] = useState([]);

  const handleFlightDetailsUpdate = (newFlightDetails) => {
    setFlightDetails(newFlightDetails);
  };

  useEffect(() => {
    if (!flightDetails) return;

    const mapSource = new GeoTIFF({
      sources: [
        {
          url: process.env.REACT_APP_API_URL+'/data/'+flightDetails.cog_path,
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
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "52px",
          mb: "59px",
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: "30%",
            backgroundColor: "rgba(240,247,235,.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "calc(100vh - 111px)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              py: 1,
            }}
          >
            Flights
          </Typography>
          <Box
            sx={{
              overflowY: "auto",
              flexGrow: 1,
              px: 1,
            }}
          >
            <FlightList
              sendData={handleFlightDetailsUpdate}
              flightList={state}
            />
          </Box>
        </Box>

        <Box
          sx={{
            width: "70%",
            backgroundColor: "rgba(240,247,235,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          {flightDetails ? (
            <MapComponent
              mapLayers={vectorLayer}
              controls={controls}
              mapSize={{ width: "100%", height: "100%" }}
            />
          ) : (
            "Select a mission from the list"
          )}
        </Box>
      </Box>

      <Footer
        prevFunc={() => {
          navigate("/");
        }}
        nextFunc={() => {
          if (!flightDetails) {
            alert("Select a flight to proceed");
            return;
          }
          navigate("/draw-plots", {
            state: { flightDetails, flightList: state },
          });
        }}
        nextDisabled={!flightDetails}
      />
    </Box>
  );
}

export default Explore;
