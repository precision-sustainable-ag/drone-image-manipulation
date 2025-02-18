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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import geoUtils from "../../utils/geoUtils";

const PlotMap = forwardRef(({ apiOutput }, ref) => {

  const [isLoading, setIsLoading] = useState(false);
  const [flightDetails] = useState(apiOutput["flight_details"] || {});
  const [metadata, setMetadata] = useState(null);

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
        `http://localhost:8000/metadata/${flightDetails.cog_path}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch metadata");
      }
      const metadata = await response.json();
      setMetadata(metadata);

      mapRef.current.addSource("cog-source", {
        type: "raster",
        tiles: [
          `http://localhost:8000/cog/tiles/WebMercatorQuad/{z}/{x}/{y}?` +
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
    const layersToHide = ["grid-layer", "grids-labels"];
    
    try {
      setIsLoading(true);
      layersToHide.forEach((layer) => {
        if (mapRef.current.getLayer(layer)) {
          mapRef.current.setLayoutProperty(layer, "visibility", "none");
        }
      });

      const zip = new JSZip();

      for (const feature of apiOutput.features.features) {
        const coordinates = feature.geometry.coordinates[0];
        const imageBlob = await capturePolygonAsImage(coordinates);
        const name = feature.properties.name || `grid-cell-${Date.now()}`;
        zip.file(`${name}.png`, imageBlob, { binary: true });
      }
      zip.generateAsync({ type: "blob" }).then((content) => {
        saveAs(content, "plot_images.zip");
      });
    } catch (error) {
      alert("Error in exporting images" + error);
    } finally {
      layersToHide.forEach((layer) => {
        if (mapRef.current.getLayer(layer)) {
          mapRef.current.setLayoutProperty(layer, "visibility", "visible");
        }
      });
      mapRef.current.fitBounds(metadata.geographic_bounds, {
        padding: 50,
        duration: 1000,
      });
      setIsLoading(false);
    }
  };

  const capturePolygonAsImage = async (coordinates) => {
    const bounds = coordinates.reduce(
      (bounds, coord) => {
        const [lng, lat] = coord;
        return [
          Math.min(bounds[0], lng),
          Math.min(bounds[1], lat),
          Math.max(bounds[2], lng),
          Math.max(bounds[3], lat),
        ];
      },
      [Infinity, Infinity, -Infinity, -Infinity]
    );

    // Calculate angle of the plot
    const start = coordinates[0];
    const end = coordinates[1];
    const centerLat = (start[1] + end[1]) / 2;
    const dxMeters = geoUtils.lonToMeters(end[0] - start[0], centerLat);
    const dyMeters = geoUtils.latToMeters(end[1] - start[1]);
    const angle = geoUtils.toDegrees(Math.atan2(dyMeters, dxMeters));

    // Fit map to this plot and angle
    mapRef.current.fitBounds(bounds, { duration: 0 });
    mapRef.current.setBearing(-angle);
    await new Promise((resolve) => {
      mapRef.current.once("idle", resolve);
    });

    // Map geographic coordinates to pixel coordinates and calculate the bounds accordingly
    const pixelCoords = coordinates.map((coord) =>
      mapRef.current.project(coord)
    );
    const minX = Math.min(...pixelCoords.map((p) => p.x));
    const maxX = Math.max(...pixelCoords.map((p) => p.x));
    const minY = Math.min(...pixelCoords.map((p) => p.y));
    const maxY = Math.max(...pixelCoords.map((p) => p.y));

    const width = Math.ceil(maxX - minX);
    const height = Math.ceil(maxY - minY);

    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      const mapCanvas = mapRef.current.getCanvas();

      if (mapCanvas) {
        context.drawImage(
          mapCanvas,
          minX,
          minY,
          width,
          height,
          0,
          0,
          width,
          height
        );
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      } else {
        reject(new Error("Canvas element not found"));
      }
    });
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
