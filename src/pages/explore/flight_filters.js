import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const FlightFilters = ({ flightList, setFilteredFlights }) => {
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

  const researchStations = getUniqueValues("research_station");
  const cloudinessOptions = getUniqueValues("cloudiness");
  const pilotNames = getUniqueValues("pilot_name");

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const filtered = flightList.filter((flight) => {
      const { pilot_name, cloudiness, mission_start_time, research_station } =
        filters;

      const flightDateStr = flight.mission_start_time.split(" ")[0];
      const flightDate = dayjs(flightDateStr);

      const matchesDate =
        !mission_start_time || flightDate.isSame(mission_start_time, "day");

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
  }, [filters, flightList, setFilteredFlights]);

  return (
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
              onChange={(newDate) =>
                handleFilterChange("mission_start_time", newDate)
              }
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
              clearable
            />
          </LocalizationProvider>
          {filters.mission_start_time && (
            <Box mt={1} textAlign="right">
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: "pointer" }}
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
              <MenuItem value="">All</MenuItem>
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
              <MenuItem value="">All</MenuItem>
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
              <MenuItem value="">All</MenuItem>
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
  );
};
export default FlightFilters;
