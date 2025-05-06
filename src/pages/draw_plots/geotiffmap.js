import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import "../../styles/App.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";
import { createGrid, reorderGrid } from "../../utils/mapUtils";
import { CustomControl } from "../../components/MapControls";
import SelectPolygonsMode from "../../components/SelectPolygonsMode";

// TODO: Change the default EPSG:3857 projection to EPSG:4326
const GeoTIFFMap = ({
  gridCols,
  gridRows,
  plotLength,
  plotWidth,
  lengthAlleywaySize,
  widthAlleywaySize,
  flightDetails,
  walkPattern,
  walkStartLocation,
  setCoordinateFeatures,
  uploadedGeojson
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

  const handleDrawUpdateAndDelete = (event) => {
    setCoordinateFeatures(drawRef.current.getAll());
    updateLabels();
  };

  const updateLabels = () => {
    if (mapRef.current.getSource("grid-labels")) {
      mapRef.current.removeLayer("grid-text");
      mapRef.current.removeSource("grid-labels");
    }
    
    mapRef.current.addSource("grid-labels",{
        type: "geojson",
        data: drawRef.current.getAll(),
      });
    
    mapRef.current.addLayer({
      id: "grid-text",
      type: "symbol",
      source: "grid-labels",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 12,
        "text-anchor": "center",
      },
      paint: {
        "text-color": "#ffffff",
      },
    });
  }

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
          select_polygons: SelectPolygonsMode
        },
      });
      drawRef.current = draw;
      mapRef.current.addControl(draw);

      const onClick = () => {
        drawRef.current.changeMode("select_polygons", drawRef.current.getAll());
      }

      mapRef.current.addControl(new CustomControl(onClick, "Select plots"));
      mapRef.current.addControl(new mapboxgl.FullscreenControl());

      mapRef.current.on("draw.create", handleDrawCreate);
      mapRef.current.on("draw.modechange", handleModeChange);
      mapRef.current.on("draw.update", handleDrawUpdateAndDelete);
      mapRef.current.on("draw.delete", handleDrawUpdateAndDelete);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.off("draw.create", handleDrawCreate);
        mapRef.current.off("draw.modechange", handleModeChange);
        mapRef.current.off("draw.update", handleDrawUpdateAndDelete);
        mapRef.current.off("draw.delete", handleDrawUpdateAndDelete);
        mapRef.current.remove();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          lengthAlleywaySize,
          widthAlleywaySize
        );

        drawRef.current.deleteAll();

        if (gridCells.length < 1) {
          console.log("Error in generating grid. Please try again.");
          return;
        }

        const orderedGrid = reorderGrid(
          gridCells,
          gridRows,
          gridCols,
          walkPattern,
          walkStartLocation
        );

        orderedGrid.forEach((cell, index) => {
          drawRef.current.add({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [cell],
            },
            properties: {
              id: `grid-cell-${index}`,
              name: `Plot ${index + 1}`,
              plot_num: index + 1,
            },
          });
        });
        handleDrawUpdateAndDelete();
      } catch (error) {
        console.error("Grid generation error:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseline, gridCols, gridRows, plotLength, plotWidth, lengthAlleywaySize, widthAlleywaySize, walkPattern, walkStartLocation]);

  useEffect(() => {
    if (!uploadedGeojson || !mapRef.current || !drawRef.current) return;

    // Ensure uploadedGeojson is a FeatureCollection with features array
    if (
      uploadedGeojson.type !== "FeatureCollection" ||
      !Array.isArray(uploadedGeojson.features)
    ) {
      console.error("Invalid GeoJSON format:", uploadedGeojson);
      return;
    }

    setBaseLine([]);
    drawRef.current.deleteAll();

    uploadedGeojson.features.forEach(({ type, geometry, properties }) => {
      if (!geometry || !properties) {
        console.warn("Skipping invalid feature:", {
          type,
          geometry,
          properties,
        });
        return;
      }

      /**
       * Reconstruct each GeoJSON feature by retaining only the 'id', 'name', and 'plot_num' properties.
       * The 'geometry' is preserved as is.
       */
      drawRef.current.add({
        type,
        geometry,
        properties: {
          id: properties.id,
          name: properties.name,
          plot_num: properties.plot_num,
        },
      });
    });

    handleDrawUpdateAndDelete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedGeojson]);
  
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
