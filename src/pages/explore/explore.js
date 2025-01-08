import { useEffect, useState } from 'react';
import '../../styles/App.css';
import GeoTIFF from 'ol/source/GeoTIFF';
import FlightList from './flight_list';
import Header from "../../components/Header";
import {Box, Grid, TextField, Typography} from '@mui/material';
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

  const flightList = state ? Object.values(state) : [];
  const [flightDetails, setFlightDetails] = useState('');
  const [vectorLayer, setVectorLayer] = useState(null);
  const [controls, setControls] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState(flightList);
  const [filters, setFilters] = useState({
    mission_start_time: "",
    research_station: "",
    cloudiness: "",
    pilot_name: "",
  });

  const handleFlightDetailsUpdate = (newFlightDetails) => {
    setFlightDetails(newFlightDetails);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
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

  useEffect(() => {
    const filtered = flightList.filter((flight) => {
      const { pilot_name, cloudiness, mission_start_time, research_station } =
        filters;
      return (
        (!mission_start_time ||
          flight.mission_start_time.includes(mission_start_time)) &&
        (!research_station ||
          flight.research_station
            .toLowerCase()
            .includes(research_station.toLowerCase())) &&
        (!cloudiness ||
          flight.cloudiness.toLowerCase().includes(cloudiness.toLowerCase())) &&
        (!pilot_name ||
          flight.pilot_name.toLowerCase().includes(pilot_name.toLowerCase()))
      );
    });
    setFilteredFlights(filtered);
  }, [filters]);

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
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="body1"
              sx={{
                position: "sticky",
                paddingTop: 0,
                zIndex: 10,
                py: 1,
                fontSize: "1.15rem",
              }}
            >
              Filter By:
            </Typography>
            <Grid container spacing={2}>
              {/* First Row */}
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  value={filters.mission_start_time}
                  onChange={(e) =>
                    handleFilterChange("mission_start_time", e.target.value)
                  }
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Research Station"
                  value={filters.research_station}
                  onChange={(e) =>
                    handleFilterChange("research_station", e.target.value)
                  }
                  size="small"
                  fullWidth
                />
              </Grid>

              {/* Second Row */}
              <Grid item xs={6}>
                <TextField
                  label="Cloudiness"
                  value={filters.cloudiness}
                  onChange={(e) =>
                    handleFilterChange("cloudiness", e.target.value)
                  }
                  size="small"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Pilot Name"
                  value={filters.pilot_name}
                  onChange={(e) =>
                    handleFilterChange("pilot_name", e.target.value)
                  }
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>
          </Box>
          <Box
            sx={{
              overflowY: "auto",
              flexGrow: 1,
              px: 1,
            }}
          >
            <FlightList
              sendData={handleFlightDetailsUpdate}
              flightList={filteredFlights}
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
            state: { flightDetails, flightList },
          });
        }}
        nextDisabled={!flightDetails}
      />
    </Box>
  );
}

export default Explore;
