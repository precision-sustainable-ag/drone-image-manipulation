import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, Grid, Typography} from '@mui/material';

import { Collection } from 'ol';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
import { getBottomLeft, getTopRight } from 'ol/extent';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Style, Stroke, Fill, Text} from 'ol/style';
import { defaults } from 'ol/interaction/defaults';
import DragRotateAndZoom  from 'ol/interaction/DragRotateAndZoom';

import GeoJSON from 'ol/format/GeoJSON';


import 'ol/ol.css';
import '../../styles/App.css';
import { Polygon } from 'ol/geom';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const PlotMap = ({apiOutput}) => {
    // const navigate = useNavigate();

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [vectorSource, setVectorSource] = useState(null);
    let gridDraw;

    useEffect(() => {
        // console.log(apiOutput);
        const mapSource = new GeoTIFF({
            sources: [
              {
                url: process.env.REACT_APP_FILE_SERVER_URL+'/flights/'+apiOutput['flight_details']['orthomosaic_url'],
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

        const map = new Map({
            target: mapRef.current,
            interactions: defaults().extend([new DragRotateAndZoom()]),
            layers: [
                new TileLayer({
                    source: mapSource,
                }),
                vectorLayer
            ],
            view: mapSource.getView(),        
        });
        setMap(map)
        setVectorSource(vectorSource)

        // map.addLayer(vectorLayer);
        const vectorExtent = vectorSource.getView();
        const mapViewExtent = map.getView();

        console.log(vectorExtent, mapViewExtent);
        //   console.log(map.getView().getProjection());
          // Clean up the map when the component is unmounted
          return () => {
            map.setTarget(null);
          };
            
    }, [apiOutput]);

    const exportPlotImages = async () => {
      if (!vectorSource) return;
      const features = vectorSource.getFeatures();
      const zip = new JSZip();

      for (const feature of features) {
          const extent = feature.getGeometry().getExtent();
          const name = feature.get('name');
          const imageBlob = await captureExtentAsImage(extent);
          zip.file(`${name}.png`, imageBlob, { binary: true })
      }

      zip.generateAsync({type: 'blob'}).then((content) => {saveAs(content, "plot_images.zip")})

  };

    const captureExtentAsImage = async (extent) => {
      return new Promise((resolve, reject) => {
          if (!map) return reject(new Error('Map not initialized'));

          const currentView = map.getView();
          const currentCenter = currentView.getCenter();
          const currentZoom = currentView.getZoom();

          map.getView().fit(extent, { size: map.getSize() });

          map.once('rendercomplete', () => {
              const mapCanvas = map.getViewport().querySelector('canvas');

              const bottomLeft = getBottomLeft(extent);
              const topRight = getTopRight(extent);

              const bottomLeftPixel = map.getPixelFromCoordinate(bottomLeft);
              const topRightPixel = map.getPixelFromCoordinate(topRight);

              // Calculate width and height of the area
              const pixelRatio = window.devicePixelRatio || 1;
              const width = Math.ceil((topRightPixel[0] - bottomLeftPixel[0]) * pixelRatio);
              const height = Math.ceil((bottomLeftPixel[1] - topRightPixel[1]) * pixelRatio);

              // Create a new canvas and context for the plot image
              const canvas = document.createElement('canvas');
              console.log("Pixel ratio: ", canvas.devicePixelRatio);
              canvas.width = width;
              canvas.height = height;
              const context = canvas.getContext('2d');

              if (mapCanvas) {
                context.drawImage(
                  mapCanvas,
                  bottomLeftPixel[0] * pixelRatio, topRightPixel[1] * pixelRatio,
                  width, height,
                  0, 0,
                  width, height
              );

              canvas.toBlob((blob) => {
                  resolve(blob);
                  map.getView().setCenter(currentCenter);
                  map.getView().setZoom(currentZoom);
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
          <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '90%', height: '400px', padding: '10px'}} />
                    <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '90%', height: '400px', }} />
                {/* </Grid> */}
                <Button variant='outlined' onClick={exportPlotImages}>EXPORT IMAGES</Button>

        </Grid>
        </Box>
    )
};

export default PlotMap;