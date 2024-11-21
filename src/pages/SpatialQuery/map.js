import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Button, Box, TextField, Grid, Typography, Backdrop, CircularProgress} from '@mui/material';

import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import {View} from 'ol';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import  Draw, { createBox }from 'ol/interaction/Draw';
import {Style, Stroke, Text} from 'ol/style';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import 'ol/ol.css';
import '../../styles/App.css';
import Header from '../Header/header';
import LayerSwitcher from 'ol-layerswitcher';
import LayerGroup from 'ol/layer/Group';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import '../../styles/App.css';
import MapComponent from '../../components/MapComponent';
import { ToggleDraw, RotateMap } from '../../components/MapControls';
import Footer from '../../components/Footer';


const SpatialMap = () => {
    const navigate = useNavigate();

    let gridDraw;

    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [coordinates, setCoordinates] = useState([]);
    const [vectorLayer, setVectorLayer] = useState(null);
    const [controls, setControls] = useState([]);
    const [view, setView] = useState(null);
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

    useEffect(() => {
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

        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
          source: vectorSource
        });

        // Map Layers
        const osmLayer = new TileLayer({
          title: 'Open Street Map',
          type: 'base',
          visible: false,
          source: new OSM(),
        });
        
        const satLayer = new TileLayer({
          title: 'Satellite View',
          type: 'base',
          visible: true,
          source: new XYZ({url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}'}),
        });

        const mapGroup = new LayerGroup({
          title: 'Map',
          layers: [osmLayer, satLayer]
        });

        //Field Vector Layers
        const cc_field_details = require('../../shared/cc_fields_2024.json');
        const srs_field_details = require('../../shared/srs_fields_2024.json');

        const cc_field_vector = new VectorLayer({
          title: 'Central Research Station',
          visible: true,
          source: new VectorSource({
            format: new GeoJSON(),
            features: new GeoJSON().readFeatures(cc_field_details, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          }),
          style: function (feature) {
            labelStyle.getText().setText(`${feature.get('field')}`);
            return style;
          }
        });

        const srs_field_vector = new VectorLayer({
          title: 'Sandhills Research Station',
          visible: true,
          source: new VectorSource({
            format: new GeoJSON(),
            features: new GeoJSON().readFeatures(srs_field_details, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857',
            }),
          }),
          style: function (feature) {
            labelStyle.getText().setText(`${feature.get('field')}`);
            return style;
          }
        });

        const fieldVectorLayerGroup = new LayerGroup({
          title: 'Field Boundaries',
          layers: [cc_field_vector, srs_field_vector]
        });

        const controls = [
          new ToggleDraw({
            vector_source: vectorSource,
            clearData: () => {
              setCoordinates([]);
            },
          }),
          new RotateMap({ direction: "left" }),
          new RotateMap({ direction: "right" }),
          new LayerSwitcher({
            activationMode: 'click',
            groupSelectStyle: 'none',
            reverse: false,
            tipLabel: 'Toggle Layers'
          }),
        ];

        setVectorLayer([mapGroup, fieldVectorLayerGroup, vectorLayer]);
        setControls(controls);
        setView(
          new View({
            center: fromLonLat([-78.99, 35.43]),
            zoom: 9,
          })
        );
    }, []);

    const drawArea = (source, map) => {
      console.log(map.getView().getProjection());
        gridDraw = new Draw({
          source: source,
          type: 'Circle',
          geometryFunction: createBox(),
        });
   
        map.addInteraction(gridDraw);
        gridDraw.on('drawend', (e) => {
            setCoordinates(e.feature.getGeometry().getCoordinates());
        });
        return gridDraw;
    };
    window.drawHandler = drawArea;

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
        <Header/>
                <Grid
                style={{
                    backgroundColor: 'rgba(240,247,235,.5)',
                    position: 'relative',
                    width: '100%',
                    // left: '50%',
                    // transform: 'translateX(-50%)',
                }}
                mt={1}>
                    <Grid item xs={12} sm={12} md={12} lg={12} align='center' mt={2}>
                        <Typography variant="h4" gutterBottom align="center">
                            Orthomosaic evaluation
                        </Typography>
                        <Typography variant="h6" gutterBottom align="center">
                            Draw a box around the concerned region and select a date range to get available missions
                        </Typography>
                    </Grid>
                    {/* <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef2} style={{ width: '90%', height: '400px', transform: 'translateX(5%)'}} mt={3} /> */}
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                      <MapComponent
                          mapLayers={vectorLayer}
                          controls={controls}
                          view={view}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={12} align='center' mt={2} style={{display: 'flex', flexDirection:'row', alignContent: 'space-around', justifyContent: 'space-evenly'}}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div>
                            <DatePicker
                            required
                            renderInput={(props) => <TextField {...props} sx={{ mr: 5 }} />}
                            label="Start Date"
                            value={startDate}
                            onChange={(newValue) => {
                            setStartDate(newValue);
                            }}
                            />
                            </div>
                            <div>
                            <DatePicker
                            required
                            renderInput={(props) => <TextField {...props} sx={{ ml: 5 }} />}
                            label="End Date"
                            value={endDate}
                            onChange={(newValue) => {
                            setEndDate(newValue);
                            }}
                            />
                            </div>
                        </LocalizationProvider>
                    </Grid>
                    <Footer nextFunc = {buttonClick} />
                </Grid>
            
        </Grid>
            
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
            Fetching flight list...
          </Typography>
        </Backdrop>
      
        </Box>
    )
};

export default SpatialMap;