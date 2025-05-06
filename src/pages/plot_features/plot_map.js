import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Typography,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import "../../styles/App.css";
import { saveAs } from "file-saver";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const PlotMap = forwardRef(({ apiOutput }, ref) => {

  const [isLoading, setIsLoading] = useState(false);
  const [flightDetails] = useState(apiOutput["flight_details"] || {});

  useImperativeHandle(ref, () => ({
    exportPlotImages,
  }));

  const mapRef = useRef();
  const mapContainerRef = useRef();

  useEffect(() => {
    if (!flightDetails) return;

    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
      },
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    mapRef.current.on("load", async () => {
      const response = await fetch(
        // `${process.env.REACT_APP_TILING_SERVER_URL}/metadata/${flightDetails.cog_path}`
        `${process.env.REACT_APP_API_URL}/metadata/${flightDetails.cog_path}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }
      const metadata = await response.json();

      mapRef.current.addSource("cog-source", {
        type: "raster",
        tiles: [
          // `${process.env.REACT_APP_TILING_SERVER_URL}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
          `${process.env.REACT_APP_API_URL}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
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
        },
      });

      mapRef.current.addSource("grids", {
        type: "geojson",
        data: apiOutput.features, // Use the grid data directly
      });

      // Add a layer to show grid boundaries
      mapRef.current.addLayer({
        id: "grid-layer",
        type: "line",
        source: "grids",
        paint: {
          "line-color": "white",
          "line-width": 2,
        },
      });

      mapRef.current.addLayer({
        id: `grids-labels`,
        type: "symbol",
        source: "grids",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-anchor": "center",
        },
        paint: {
          "text-color": "#ffffff",
          // "text-halo-color": "#ffffff",
          // "text-halo-width": 1
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
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [apiOutput.features, flightDetails]);

  const exportPlotImages = async () => {
    if (!mapRef.current || !apiOutput.features) return;

    try {
      setIsLoading(true);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/export-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flight_id: apiOutput.flight_details.flight_id,
          features: apiOutput.features.features,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to export images: ${errorData.message}`);
      }

      const blob = await response.blob();
      saveAs(blob, "plot_images.zip");
    } catch (error) {
      alert("Error in exporting images " + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
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
        <Typography variant="h6">
          Please wait while the data is being exported...
        </Typography>
      </Backdrop>
    </React.Fragment>
  );
});

export default PlotMap;
