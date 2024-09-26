import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, TextField, Grid, Typography} from '@mui/material';

import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import TileLayer from 'ol/layer/Tile';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Control} from 'ol/control';
import  Draw, { createBox }from 'ol/interaction/Draw';
import Translate from 'ol/interaction/Translate';
import {Style, Stroke, Fill, Text} from 'ol/style';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import 'ol/ol.css';
import '../../styles/App.css';
import Header from '../Header/header';
import LayerSwitcher from 'ol-layerswitcher';
import { BaseLayerOptions, GroupLayerOptions } from 'ol-layerswitcher';
import LayerGroup from 'ol/layer/Group';
// import * as field_details from '../../shared/cc_fields_2024.geojson';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import '../../styles/App.css';


// TODO: Move to shared resources
class ToggleDraw extends Control {
    constructor(opt_options) {
      
      const options = opt_options || {};
      const button = document.createElement('button');
      button.className = 'toggle-button';
      button.innerHTML = 'Draw';
  
      const element = document.createElement('div');
      element.className = 'toggle-draw';
      element.appendChild(button);
  
      super({
        element: element,
        target: options.target,
      });
  
      this.vectorSource = options['vector_source'];
      this.mapRef = options['map_reference'];
      // this.map = map;
      
      button.addEventListener('click', this.handleToggleDraw.bind(this), false);
    }
    handleToggleDraw() {
      window.drawArea(this.vectorSource, this.mapRef);
    }
  }


const SpatialMap = () => {
    const navigate = useNavigate();

    const mapRef = useRef(null);
    let gridDraw;

    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [coordinates, setCoordinates] = useState([]);

    const buttonClick = async () => {
        if (startDate.isAfter(endDate)) {
            alert('End date needs to be after the start date');
            return;
            // console.log('large');
        }
        setStartDate(moment(startDate).format('YYYY-MM-DD'));
        setStartDate(moment(endDate).format('YYYY-MM-DD'));

        const requestJson = {
            'start_date': startDate,
            'end_date': endDate,
            'polygon_coordinates': coordinates,
        };
        try {
            // const response = await axios.post('http://localhost:5000/setGrid', coordinateFeatures, 
            // { headers: {
            //   'Content-Type': 'application/json',
            // }});
            // console.log(response.data);
            // navigate('/plot-features', {state : response.data} );
            navigate('/explore', {state: requestJson});
            // history.push('/plot-features');
          } catch (error) {
            console.log(error);
          }
        
    };
    useEffect(() => {
      const field_details = require('../../shared/cc_fields_2024.json');
        const vectorSource = new VectorSource();
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
        // const map = new Map({
        //     target: mapRef.current,
        //     layers: [
        //       new TileLayer({
        //           // source: new OSM(),
        //           source: new XYZ({
        //             url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'
        //           })
        //       }),
        //       new VectorLayer({
        //         source: vectorSource,
        //       }),
        //     ],
        //     view: new View({
        //       center: fromLonLat([-87.5, 42.0]),
        //       zoom: 4,
        //     }),
        // });
        const osmLayer = new TileLayer({
          title: 'OSM',
          type: 'base',
          visible: true,
          source: new OSM(),
        });
        const osm2 = new TileLayer({
          title: 'Satellite View',
          type: 'base',
          visible: false,
          source: new XYZ({url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}'}),
        });
        const layerswitcher = new LayerSwitcher({
          // activationMode: 'click',
          startActive: false,
        });
        const map = new Map({
          target: mapRef.current,
          layers: [
            osm2, osmLayer,
            // new LayerGroup({
            //   title: 'Base maps',
            //   type: 'base',
            //   visible: true,
            //   layers: [osmLayer, osm2]
            // }),
            new VectorLayer({
              source: vectorSource,
            })
          ],
          view: new View({
            center: fromLonLat([-80.5, 35.0]),
            zoom: 6,
          }),
        });
        map.addControl(layerswitcher);

        map.addControl(new ToggleDraw({'vector_source':vectorSource, 'map_reference':map}));
        
        const field_vector = new VectorLayer({
          source: new VectorSource({
            format: new GeoJSON(),
            // url: 'http://152.7.196.7/cc/cc_fields_2024.geojson',
            features: new GeoJSON().readFeatures(field_details, {
              dataProjection: 'EPSG:4326',
              featureProjection: map.getView().getProjection(),
            }),
          }),
          style: function (feature) {
            labelStyle.getText().setText(`${feature.get('field')}`);
            return style;
          }
        });
        map.addLayer(field_vector);
        return () => {
            map.setTarget(null);
        };
            
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
            // console.log(map.getView());

        });
    };
    window.drawArea = drawArea;

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
      {/* <Grid> */}
        
      {/* </Grid> */}
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
                    <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '90%', height: '400px', transform: 'translateX(5%)'}} mt={3} />
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
                    <Grid item xs={12} sm={12} md={12} lg={12} align='right' mt={2}>
                        <Button onClick={buttonClick}>NEXT</Button>
                    </Grid>
                </Grid>
            
        </Grid>
            
      
        </Box>
    )
};

export default SpatialMap;