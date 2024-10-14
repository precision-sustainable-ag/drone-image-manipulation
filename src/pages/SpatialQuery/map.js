import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Button, Box, TextField, Grid, Typography} from '@mui/material';

import OSM from 'ol/source/OSM';
import { View } from 'ol';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import  Draw, { createBox }from 'ol/interaction/Draw';
import Translate from 'ol/interaction/Translate';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from 'moment';
import 'ol/ol.css';
import '../../styles/App.css';
import Header from '../Header/header';
import MapComponent from '../../components/MapComponent';
import { ToggleDraw } from '../../components/MapControls';

const SpatialMap = () => {
    const navigate = useNavigate();

    let gridDraw;

    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [coordinates, setCoordinates] = useState([]);

    const [mapSource, setMapSource] = useState(null);
    const [vectorLayer, setVectorLayer] = useState(null);
    const [controls, setControls] = useState([]);
    const [view, setView] = useState([]);

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
        const mapSource = new OSM();
        const vectorSource = new VectorSource();
        const vectorLayer = new VectorLayer({
          source: vectorSource,
        });
        const controls = [new ToggleDraw({ vector_source: vectorSource })];
        const view = new View({
          center: fromLonLat([0, 0]),
          zoom: 2,
        });

        setMapSource(mapSource);
        setVectorLayer(vectorLayer);
        setControls(controls);
        setView(view);
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
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        <MapComponent
                          mapSource={mapSource}
                          vectorLayer={vectorLayer}
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
                    <Grid item xs={12} sm={12} md={12} lg={12} align='right' mt={2}>
                        <Button onClick={buttonClick}>NEXT</Button>
                    </Grid>
                </Grid>
            
        </Grid>
        </Box>
    )
};

export default SpatialMap;