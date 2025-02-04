import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Typography,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "../../styles/App.css";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import spatialQueryVideo from "../../assets/videos/spatial_query_eg.mp4";
import { fromLonLat } from "ol/proj";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";

const FindMissions = () => {
  const navigate = useNavigate();
  const cc_field_details = require("../../shared/cc_fields_2024.json");
  const srs_field_details = require("../../shared/srs_fields_2024.json");
  const mapRef = useRef();
  const mapContainerRef = useRef();

  useEffect(() => {
    const INITIAL_CENTER = [-78.99, 35.43];
    const INITIAL_ZOOM = 7;
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    mapRef.current.on("load", async () => {
      const addFieldLayoutLayer = (
        field_data,
        name,
        markerCoords,
        markerText
      ) => {
        mapRef.current.addSource(name, {
          type: "geojson", // Ensure 'geojson' type is used
          data: field_data, // Your JSON object
        });

        mapRef.current.addLayer({
          id: `${name}-fill`,
          type: "fill",
          source: name,
          layout: {},
          paint: {
            "fill-color": "#0080ff",
            "fill-opacity": 0.1,
          },
        });

        mapRef.current.addLayer({
          id: `${name}-outline`,
          type: "line",
          source: name,
          layout: {},
          paint: {
            "line-color": "#ffffff",
            "line-width": 2,
          },
        });

        mapRef.current.addLayer({
          id: `${name}-labels`,
          type: "symbol",
          source: name,
          layout: {
            "text-field": ["get", "field"],
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              13.99,
              0,
              14,
              8,
              15,
              10,
              16,
              12,
            ],
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        if (markerCoords) {
          const marker = new mapboxgl.Marker({ color: "red" })
            .setLngLat(markerCoords)
            .addTo(mapRef.current);

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(`<h4>${markerText}</h4>`);

          marker.getElement().addEventListener("mouseenter", () => {
            popup.setLngLat(marker.getLngLat()).addTo(mapRef.current);
          });

          marker.getElement().addEventListener("mouseleave", () => {
            popup.remove();
          });

          marker.getElement().addEventListener("click", () => {
            mapRef.current.flyTo({
              center: markerCoords,
              zoom: 14.66,
              essential: true,
            });
          });
        }
      };

      addFieldLayoutLayer(
        srs_field_details,
        "srs",
        [-79.6808, 35.1876],
        "Sandhills Research Station"
      );
      addFieldLayoutLayer(
        cc_field_details,
        "cc",
        [-78.5025, 35.6689],
        "Central Research Station"
      );

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          rectangle: true,
          polygon: true,
          trash: true,
        },
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle,
        },
      });

      mapRef.current.on("draw.modechange", (event) => {
        if (event.mode === "draw_polygon") {
          const data = draw.getAll();

          if (data.features.length > 1) {
            // If more than one feature exists, delete the previous ones
            draw.deleteAll();
          }
          draw.changeMode("draw_rectangle");
        }
      });

      mapRef.current.on("draw.create", (event) => {
        setCoordinates([
          event.features[0].geometry.coordinates[0].map((coord) =>
            fromLonLat(coord)
          ),
        ]);
      });
      mapRef.current.addControl(draw);
    });

    return () => {
      mapRef.current.remove();
    };
  }, [srs_field_details, cc_field_details]);

  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [coordinates, setCoordinates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const buttonClick = async () => {
    if (!startDate || !endDate || coordinates.length === 0) {
      alert("Select a date range and draw the grid");
      return;
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      alert("End date needs to be after the start date");
      return;
    }

    const requestJson = {
      start_date: startDate,
      end_date: endDate,
      polygon_coordinates: coordinates,
    };

    try {
      setIsLoading(true);
      const response = await fetch(
        process.env.REACT_APP_API_URL + "/flight-list",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestJson),
        }
      );

      const data = await response.json();

      if (data.flights && Object.keys(data.flights).length > 0) {
        navigate("/explore", { state: data.flights });
      } else {
        alert("No flights found for the selected options");
      }
    } catch (error) {
      console.log(error);
      alert("Error in fetching flights");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        justifyContent: "space-between",
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
          height: "calc(100vh - 111px)",
          backgroundColor: "rgba(240,247,235,.5)",
        }}
      >
        <Box
          sx={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            p: 2,
          }}
        >
          <Typography variant="h4" gutterBottom align="left">
            Find Missions
          </Typography>
          <Typography variant="body1" gutterBottom align="left">
            First, draw a box on the map to see missions in that area →
          </Typography>
          <div
            style={{
              marginTop: "10px",
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: "100%",
                overflow: "hidden",
                maxWidth: "500px",
              }}
            >
              <video
                src={spatialQueryVideo}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain", // Ensures the whole video is visible without cropping
                  display: "block",
                }}
                muted
                loop
                autoPlay
              />
            </Box>
          </div>
          <Typography variant="body1" gutterBottom align="left" mt={2}>
            Next, select the dates you’d like to see missions within.
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <DatePicker
                required
                renderInput={(props) => <TextField {...props} />}
                label="Start Date"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                }}
              />
              <DatePicker
                required
                renderInput={(props) => <TextField {...props} />}
                label="End Date"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                }}
              />
            </div>
          </LocalizationProvider>
        </Box>

        <Box
          sx={{
            width: "60%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <div
            id="map-container"
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        </Box>
      </Box>

      <Footer
        nextFunc={buttonClick}
        nextDisabled={!startDate || !endDate || coordinates.length === 0}
      />

      <Backdrop
        sx={{
          color: "#ffffff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={isLoading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Fetching flight list...</Typography>
      </Backdrop>
    </Box>
  );
};

export default FindMissions;
