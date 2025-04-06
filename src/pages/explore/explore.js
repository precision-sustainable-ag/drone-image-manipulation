import { useEffect, useState } from 'react';
import '../../styles/App.css';
import GeoTIFF from 'ol/source/GeoTIFF';
import FlightList from './flight_list';
import Header from "../../components/Header";
import {Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import MapComponent from '../../components/MapComponent';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { RotateMap } from '../../components/MapControls';
import Footer from "../../components/Footer";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function Explore() {

  const {state} = useLocation();
  const navigate = useNavigate();

  const flightList = state ? Object.values(state) : [];
  const [flightDetails, setFlightDetails] = useState('');
  const [vectorLayer, setVectorLayer] = useState(null);
  const [controls, setControls] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState(flightList);
  const [filters, setFilters] = useState({
    mission_start_time: null,
    research_station: "",
    cloudiness: "",
    pilot_name: "",
  });

  const getUniqueValues = (key) => {
    return [...new Set(flightList.map((flight) => flight[key]))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  };
  
  const missionTimes = getUniqueValues("mission_start_time");
  const researchStations = getUniqueValues("research_station");
  const cloudinessOptions = getUniqueValues("cloudiness");
  const pilotNames = getUniqueValues("pilot_name");

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

      const flightDateStr = flight.mission_start_time.split(" ")[0];
      const flightDate = dayjs(flightDateStr);
    
      const matchesDate = !mission_start_time || flightDate.isSame(mission_start_time, 'day');

      return (
        matchesDate &&
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
            align="center"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              pt: 1,
            }}
          >
            Flights
          </Typography>
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="body1"
              sx={{
                py: 1,
                fontSize: "1.15rem",
              }}
            >
              Filter By:
            </Typography>
            <Grid container spacing={2}>
              {/* First Row */}
              <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date"
                  value={filters.mission_start_time}
                  onChange={(newDate) => handleFilterChange("mission_start_time", newDate)}
                  slotProps={{
                    textField: { size: 'small', fullWidth: true }
                  }}
                  clearable
                />
              </LocalizationProvider>
              {filters.mission_start_time && (
                <Box mt={1} textAlign="right">
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleFilterChange("mission_start_time", null)}
                  >
                    Clear Date
                  </Typography>
                </Box>
              )}
              </Grid>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Research Station</InputLabel>
                  <Select
                    value={filters.research_station}
                    label="Research Station"
                    onChange={(e) =>
                      handleFilterChange("research_station", e.target.value)
                    }
                  >
                    <MenuItem value="">None</MenuItem>
                    {researchStations.map((station, idx) => (
                      <MenuItem key={idx} value={station}>
                        {station}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Second Row */}
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Cloudiness</InputLabel>
                  <Select
                    value={filters.cloudiness}
                    label="Cloudiness"
                    onChange={(e) => handleFilterChange("cloudiness", e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {cloudinessOptions.map((cloud, idx) => (
                      <MenuItem key={idx} value={cloud}>
                        {cloud}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Pilot Name</InputLabel>
                  <Select
                    value={filters.pilot_name}
                    label="Pilot Name"
                    onChange={(e) => handleFilterChange("pilot_name", e.target.value)}
                  >
                    <MenuItem value="">None</MenuItem>
                    {pilotNames.map((pilot, idx) => (
                      <MenuItem key={idx} value={pilot}>
                        {pilot}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
