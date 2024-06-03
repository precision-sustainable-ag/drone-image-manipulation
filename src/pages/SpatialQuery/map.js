import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, TextField, Grid, Typography} from '@mui/material';

import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import {Map, View} from 'ol';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Control} from 'ol/control';
import  Draw, { createBox }from 'ol/interaction/Draw';
import Translate from 'ol/interaction/Translate';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import 'ol/ol.css';
import '../../styles/App.css';
import Header from '../Header/header';


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
      window.drawGrid(this.vectorSource, this.mapRef);
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
        const vectorSource = new VectorSource();

        const map = new Map({
            target: mapRef.current,
            layers: [
              new TileLayer({
                source: new OSM(),
              }),
              new VectorLayer({
                source: vectorSource,
              })
            ],
            view: new View({
              center: fromLonLat([0, 0]),
              zoom: 2,
            }),
        });

        map.addControl(new ToggleDraw({'vector_source':vectorSource, 'map_reference':map}));

        return () => {
            map.setTarget(null);
        };
            
    }, []);
    

    const drawGrid = (source, map) => {
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
        
        // gridDraw.on('drawend', (e) => {
        //   map.removeInteraction(gridDraw);
    
        //   const translate = new Translate({
        //     features: new Collection([e.feature]),
        //   });
    
        //   translate.on('translating', (ev) => {
        //     ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
        //   });
        //   translate.on('translateend', (ev) => {
        //     setCoordinateFeatures((oldData) => ({
        //       ...oldData,
        //       'box': [],
        //       'vertical': [],
        //       'horizontal': []
        //     }));
        //     // setCoordinateFeatures({});
        //     ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
        //   });
        //   map.addInteraction(translate);
        // });
    };
    window.drawGrid = drawGrid;

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