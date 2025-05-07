import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import "../../styles/App.css";
import FlightList from "./flight_list";
import FlightFilters from './flight_filters';
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

function Explore() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef();
  const mapContainerRef = useRef();

  // const INITIAL_CENTER = [-78.99, 35.43];
  // const INITIAL_ZOOM = 7;
  const flightList = useMemo(() => {
    return state ? Object.values(state) : [];
  }, [state]);
  const [flightDetails, setFlightDetails] = useState("");
  const [filteredFlights, setFilteredFlights] = useState(flightList);

  const handleFlightDetailsUpdate = (newFlightDetails) => {
    setFlightDetails(newFlightDetails);
  };

  useEffect(() => {
    if (!flightDetails) return;
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      // center: INITIAL_CENTER,
      // zoom: INITIAL_ZOOM,
      // style: "mapbox://styles/mapbox/satellite-streets-v12",
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    mapRef.current.on("load", async () => {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/data/metadata/${flightDetails.cog_path}`
      );
      if (response.ok) {
        console.log(process.env.REACT_APP_API_URL);
      }
      // const response = await fetch(
      //   `${process.env.REACT_APP_TILING_SERVER_URL}/metadata/${flightDetails.cog_path}`
      // );
      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }
      const metadata = await response.json();

      mapRef.current.addSource("cog-source", {
        type: "raster",
        tiles: [
          // `${process.env.REACT_APP_TILING_SERVER_URL}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
          `${process.env.REACT_APP_API_URL}/data/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
            `url=${metadata.url}` +
            `&format=png` +
            `&bidx=1&bidx=2&bidx=3` + // Specify RGB bands
            `&resampling=bilinear`, // Use bilinear resampling for better quality
        ],
        tileSize: 256,
        minzoom: metadata.minzoom,
        maxzoom: metadata.maxzoom,
        bounds: metadata.geographic_bounds,
      });

      mapRef.current.addLayer({
        id: "cog-layer",
        type: "raster",
        source: "cog-source",
        paint: {
          "raster-opacity": 1,
          "raster-resampling": "linear",
        },
      });

      // Fit map to bounds
      mapRef.current.fitBounds(metadata.geographic_bounds, {
        padding: 50,
        duration: 1000,
      });

      // Set minimum and maximum zoom based on the bounds
      const minZoom = Math.log2(
        360 / (metadata.geographic_bounds[2] - metadata.geographic_bounds[0])
      );
      mapRef.current.setMinZoom(minZoom);
      mapRef.current.setMaxZoom(metadata.maxzoom);
    });

    return () => {
      mapRef.current.remove();
    };
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

          <FlightFilters
            flightList={flightList}
            setFilteredFlights={setFilteredFlights}
          />
          
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
            <div
              id="map-container"
              ref={mapContainerRef}
              style={{ width: "100%", height: "100%" }}
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
