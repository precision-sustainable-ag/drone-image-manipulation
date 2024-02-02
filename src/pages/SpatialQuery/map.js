import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, TextField, Grid} from '@mui/material';

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

import 'ol/ol.css';
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
        const requestJson = {
            'start_date': startDate,
            'end_date': endDate,
            'polygon_coordinates': coordinates,
        };
        console.log(requestJson);
        try {
            // const response = await axios.post('http://localhost:5000/setGrid', coordinateFeatures, 
            // { headers: {
            //   'Content-Type': 'application/json',
            // }});
            // console.log(response.data);
            // navigate('/plot-features', {state : response.data} );
            navigate('/explore');
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
        <Grid container spacing={2}>
            
                <Grid
                style={{
                    backgroundColor: 'rgba(240,247,235,.5)',
                    position: 'relative',
                    width: '100%',
                    // left: '50%',
                    // transform: 'translateX(-50%)',
                }}
                mt={1}>
                    <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '90%', height: '400px', transform: 'translateX(5%)'}} mt={3} />
                    <Grid item xs={12} sm={12} md={12} lg={12} align='center' mt={2}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                            renderInput={(props) => <TextField {...props} sx={{ mr: 2 }} />}
                            label="Start Date"
                            value={startDate}
                            onChange={(newValue) => {
                            setStartDate(newValue.toString());
                            }}
                            style={{ margin: '10px'}}
                            />
                            <DatePicker
                            renderInput={(props) => <TextField {...props} sx={{ ml: 2 }} />}
                            label="End Date"
                            value={endDate}
                            onChange={(newValue) => {
                            setEndDate(newValue.toString());
                            }}
                            />
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