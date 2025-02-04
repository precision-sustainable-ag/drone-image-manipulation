import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import "../../styles/App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";
import createGrid from "../../utils/mapUtils";

// TODO: Change the default EPSG:3857 projection to EPSG:4326
const GeoTIFFMap = ({
  gridCols,
  gridRows,
  plotLength,
  plotWidth,
  alleywaySize,
  flightDetails,
}) => {
  const mapRef = useRef();
  const mapContainerRef = useRef();
  const drawRef = useRef();
  const [baseline, setBaseLine] = useState([]);

  const handleDrawCreate = (event) => {
    const line = event.features[0].geometry.coordinates;
    if (line.length !== 2) {
      console.error("LineString must have exactly two points.");
      drawRef.current.delete(event.features[0].id);
      return;
    }
    setBaseLine(line);
    drawRef.current.deleteAll();
  };

  const handleModeChange = (event) => {
    if (event.mode === "draw_line_string") {
      // const data = drawRef.current.getAll();
      // if (data.features.length > 1) {
      //   drawRef.current.deleteAll();
      // }
      drawRef.current.changeMode("draw_line_string");
    }
  };

  useEffect(() => {
    if (!flightDetails) return;

    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-left");

    mapRef.current.on("load", async () => {
      const response = await fetch(
        `http://localhost:8000/metadata/${flightDetails.cog_path}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }
      const metadata = await response.json();

      mapRef.current.addSource("cog-source", {
        type: "raster",
        tiles: [
          `http://localhost:8000/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
            `url=${process.env.REACT_APP_API_URL}/data/${flightDetails.cog_path}` +
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

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          line_string: true,
          polygon: true,
          trash: true,
        },
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle,
        },
      });
      drawRef.current = draw;
      mapRef.current.addControl(draw);

      mapRef.current.on("draw.create", handleDrawCreate);
      mapRef.current.on("draw.modechange", handleModeChange);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off("draw.create", handleDrawCreate);
        mapRef.current.off("draw.modechange", handleModeChange);
        mapRef.current.remove();
      }
    };
  }, [flightDetails]);

  useEffect(() => {
    if (baseline.length === 2 && mapRef.current && drawRef.current) {
      try {
        const gridCells = createGrid(
          baseline,
          gridCols,
          gridRows,
          plotLength,
          plotWidth,
          alleywaySize
        );

        drawRef.current.deleteAll();

        if (gridCells.length < 1) {
          console.log("Error in generating grid. Please try again.");
          return;
        }

        gridCells.forEach((cell, index) => {
          drawRef.current.add({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [cell],
            },
            properties: {
              id: `grid-cell-${index}`,
            },
          });
        });
      } catch (error) {
        console.error("Grid generation error:", error);
      }
    }
  }, [baseline, gridCols, gridRows, plotLength, plotWidth, alleywaySize]);

  return (
    <Box
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  );
};

export default GeoTIFFMap;
