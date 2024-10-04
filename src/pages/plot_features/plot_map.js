import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {Button, Box, Grid, Typography} from '@mui/material';

import GeoTIFF from 'ol/source/GeoTIFF';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Style, Stroke, Text} from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { Polygon } from 'ol/geom';

import 'ol/ol.css';
import '../../styles/App.css';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MapComponent from '../../components/MapComponent';
import { RotateMap } from '../../components/MapControls';

const PlotMap = forwardRef(({apiOutput}, ref) => {
    // const navigate = useNavigate();

    const mapRef = useRef(null);
    const [mapSource, setMapSource] = useState(null);
    const [vectorLayer, setVectorLayer] = useState(null);
    const [controls, setControls] = useState([]);
    let gridDraw;

    useImperativeHandle(ref, () => ({
      exportPlotImages,
  }));

  const handleMapInit = useCallback((mapInstance) => {
    mapRef.current = mapInstance;
}, []);

    useEffect(() => {
        if (!apiOutput) return;

        const mapSource = new GeoTIFF({
            sources: [
              {
                url: process.env.REACT_APP_FILE_SERVER_URL+apiOutput['flight_details']['research_station']+'/flights/'+apiOutput['flight_details']['cog_path'],
                crossOrigin: 'anonymous',
                // projection: 'EPSG:4326'
              },
            ],
          });
        const geoJSONFormat = new GeoJSON();
        const geoJSONFeature = geoJSONFormat.readFeatures(apiOutput['features']);

        // console.log(customFeat);
        const vectorSource = new VectorSource({
            // features: [customFeat]
            features: geoJSONFeature
            // features: new Collection(apiOutput['features']),
        });

        const boundaryStyle = new Style({
            stroke: new Stroke({
                color: 'white',
                width: 2,
            }),
        });
        const labelStyle = new Style({
            text: new Text({
              font: '13px Calibri,sans-serif',
              stroke: new Stroke({
                color: '#fff',
                width: 3,
              }),
            }),
          });
        const style = [boundaryStyle, labelStyle];
        const vectorLayer = new VectorLayer({
            source: vectorSource,
            style: function (feature) {
                labelStyle.getText().setText(`${feature.get('name')}`);
                return style;
            }
            // style: customStyleFunction // Apply the custom style function
        });
        const controls = [new RotateMap({direction: 'left'}), new RotateMap({direction: 'right'})];

        setMapSource(mapSource);
        setVectorLayer(vectorLayer);
        setControls(controls);
            
    }, [apiOutput]);

    const exportPlotImages = async () => {
      if (!vectorLayer) return;
      
      const features = vectorLayer.getSource().getFeatures();
      const zip = new JSZip();

      for (const feature of features) {
          const flatCoordinates = feature.getGeometry().getFlatCoordinates();
          const gridCoordinates = [];
          for (let i = 0; i < flatCoordinates.length; i += 2) {
              gridCoordinates.push([flatCoordinates[i], flatCoordinates[i + 1]]);
          }
          const name = feature.get('name');
          const imageBlob = await captureExtentAsImage(gridCoordinates);
          zip.file(`${name}.png`, imageBlob, { binary: true });
      }

      zip.generateAsync({type: 'blob'}).then((content) => {saveAs(content, "plot_images.zip")})
  };

    const captureExtentAsImage = async (gridCoords) => {
      return new Promise((resolve, reject) => {
          if (!mapRef.current) return reject(new Error('Map not initialized'));

          const map = mapRef.current;
          const currentView = map.getView();
          const currentCenter = currentView.getCenter();
          const currentZoom = currentView.getZoom();
          const currentRotation = currentView.getRotation();

          const polygon = new Polygon([gridCoords]);
          map.getView().setRotation(apiOutput.rotation);
          map.getView().fit(polygon, { size: map.getSize() });

          map.once('rendercomplete', () => {
              const mapCanvas = map.getViewport().querySelector('canvas');

              // Calculate pixel coordinates from actual coordinates
              const gridPixels = gridCoords.map((coord) => map.getPixelFromCoordinate(coord));

              const topLeftPixel = gridPixels[0];
              const bottomRightPixel = gridPixels[2];

              // Calculate width and height of the area
              const pixelRatio = window.devicePixelRatio || 1;
              const width = Math.ceil((bottomRightPixel[0] - topLeftPixel[0]) * pixelRatio);
              const height = Math.ceil((bottomRightPixel[1] - topLeftPixel[1]) * pixelRatio);

              // Create a new canvas and context for the plot image
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const context = canvas.getContext('2d');

              if (mapCanvas) {
                context.drawImage(
                  mapCanvas,
                  topLeftPixel[0] * pixelRatio, topLeftPixel[1] * pixelRatio,
                  width, height,
                  0, 0,
                  width, height
              );

              canvas.toBlob((blob) => {
                  resolve(blob);
                  map.getView().setCenter(currentCenter);
                  map.getView().setZoom(currentZoom);
                  map.getView().setRotation(currentRotation);
              }, 'image/png');
              } else {
                  reject(new Error('Canvas element not found'));
              }
          });

          map.renderSync();
      });
  };

    return (
      <Box
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100px'
            }}
            margin={5}
      >
        <Grid container spacing={2}>
                <Grid item xs={12} md={12} lg={12}
                style={{
                backgroundColor: 'rgba(240,247,235,.5)',
                position: 'relative',
                width: '100%',
                }} mt={3}>
                    <Typography variant="h5" gutterBottom align="center">
                        Plot Details
                    </Typography>
                    <Typography variant="h6" gutterBottom align="center">
                        {apiOutput.flight_details.display_name}
                    </Typography>

                </Grid>
        </Grid>
        <Grid container spacing={2} 
        style={{
            backgroundColor: 'rgba(240,247,235,.5)',
            // position: 'relative',
            // width: '100%',
            // left: '1%',
            // transform: 'translateX(-50%)',
        }}
        mt={2}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
          <MapComponent
            mapSource={mapSource}
            vectorLayer={vectorLayer}
            controls={controls}
            onMapInit={handleMapInit}
          />
        </Grid>
        </Grid>
      </Box>
    )
});

export default PlotMap;