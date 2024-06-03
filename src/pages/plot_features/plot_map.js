import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, Grid} from '@mui/material';

import { Collection } from 'ol';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Projection from 'ol/proj/Projection';
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

const PlotMap = ({apiOutput}) => {
    // const navigate = useNavigate();

    const mapRef = useRef(null);
    let gridDraw;

    useEffect(() => {
        // console.log(apiOutput);
        const mapSource = new GeoTIFF({
            sources: [
              {
                url: apiOutput['flight_details']['orthomosaic_url'],
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

    return (
    //     <Box
    //   style={{
    //     height: '100%',
    //     // display: 'flex',
    //     // flexDirection: 'column',
    //     minHeight: '100px',
    //     minWidth: '500px'
    //   }}
    //   margin={5}
    // >
        <Grid container spacing={2} 
        style={{
            backgroundColor: 'rgba(240,247,235,.5)',
            // position: 'relative',
            // width: '100%',
            // left: '1%',
            // transform: 'translateX(-50%)',
        }}
        mt={2} ml={0}>
            
                {/* <Grid
                style={{
                    backgroundColor: 'rgba(240,247,235,.5)',
                    position: 'relative',
                    width: '100%',
                    left: '1%',
                    // transform: 'translateX(-50%)',
                }}
                mt={2}> */}
                    <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '90%', height: '400px', }} />
                {/* </Grid> */}
            
        </Grid>
            
      
        // </Box>
    )
};

export default PlotMap;