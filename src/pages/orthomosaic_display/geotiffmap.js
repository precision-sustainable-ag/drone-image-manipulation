import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Backdrop, Box, Button, CircularProgress, FormControl,
  Grid, InputLabel, Select, Modal, MenuItem, Typography } from '@mui/material';

import { Collection } from 'ol';
import Map from 'ol/Map';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';
import { Draw } from 'ol/interaction';
import Translate from 'ol/interaction/Translate';
import { defaults } from 'ol/interaction/defaults';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import { getBottomLeft, getTopLeft, getTopRight, getBottomRight, getCenter, boundingExtent } from 'ol/extent';
import {Style, Stroke, Fill} from 'ol/style';
import DragRotateAndZoom  from 'ol/interaction/DragRotateAndZoom';
import {Control} from 'ol/control';
import { Polygon, MultiPoint} from 'ol/geom';
import { fromUserCoordinate, getUserProjection } from 'ol/proj';

import 'ol/ol.css';
import '../../styles/App.css';
import FieldFeatureModal from './field_features_modal';
import { set } from 'ol/transform';


const leftRotate = require("../../assets/images/rotate-left.png");
const rightRotate = require("../../assets/images/rotate-right.png");

class ToggleDraw extends Control {
  constructor(opt_options) {
    
    const options = opt_options || {};
    const button = document.createElement('button');
    button.className = 'toggle-button';
    button.innerHTML = 'Draw';

    const element = document.createElement('div');
    element.className = 'toggle-draw button-hover';
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

class RotateMap extends Control {
  constructor(options) {

    const direction = options["direction"];

    const button = document.createElement("button");
    button.className = "rotate-button";
    const img = document.createElement("img");
    img.src = direction === "left" ? leftRotate : rightRotate;
    img.className = "rotate-img";
    button.appendChild(img);
    button.title =
      direction === "left"
        ? "Rotate left\nShift+Drag"
        : "Rotate right\nShift+Drag";

    const element = document.createElement("div");
    element.className =
      direction === "left"
        ? "rotate-div left-rotate-div button-hover"
        : "rotate-div right-rotate-div button-hover";
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    this.direction = direction;
    button.addEventListener("click", this.handleRotate.bind(this), false);
  }
  handleRotate() {
    const view = this.getMap().getView();
    const rotation = view.getRotation();
    view.animate({
      rotation:
        this.direction === "left"
          ? rotation - Math.PI / 20
          : rotation + Math.PI / 20,
      duration: 250,
    });
  }
}

// TODO: Change the default EPSG:3857 projection to EPSG:4326
const GeoTIFFMap = ({gridCols, gridRows, flightDetails}) => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  let gridDraw;
  const [coordinateFeatures, setCoordinateFeatures] = useState({});
  const [fieldFeatures, setFieldFeatures] = useState({
    'planting_date': null,
    'insect_damage': null,
    'crop_type': null,
  });

  const [walkPattern, setWalkPattern] = useState('dh');
  const [walkStartLocation, setWalkStartLocation] = useState('tl');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [respData, setRespData] = useState(null);

  const handleFieldFeaturesUpdate = (newData) => {
    setFieldFeatures(newData);
  };

  const forceLoad = (d) => {
    let x = 0;

    const iterate = (data) => {
      for (const [key, value] of Object.entries(data)) {
        if (key && value) {
          if (typeof value === 'object' && value !== null) {iterate(value);} else {x += 1;}
        }
      }
    };
    iterate(d);
    return x;
  };

  const sendGrid = async () => {
    
    // TODO: error handling, loading modal
    // TODO: sending field features
    if ([null, undefined, ''].includes(fieldFeatures['crop_type']) || [null,undefined, ''].includes(fieldFeatures['lead_scientist'])){
      alert('Please add required details by clicking "Add Field Features"');
      return;
    }
    const requestData = {
      'flight_id': coordinateFeatures['flight_id'],
      'coordinate_features': coordinateFeatures,
      'data_collection_method': {
        'start_point': walkStartLocation,
        'pattern': walkPattern,
      },
      'field_features': fieldFeatures
    }
    try {
      setLoading(true);
      const response = await axios.post(process.env.REACT_APP_API_URL+'/set-grid', requestData, 
      { headers: {
        'Content-Type': 'application/json',
      }});
      setIsSubmitted(true);
      console.log('response', response);
      let responseData = response.data;
      // responseData = JSON.parse(response.data.replace(/\bNaN\b/g, "null"));

      if (forceLoad(responseData) > 0){
        setRespData(responseData);
        console.log('forceloaded');
        setIsSubmitted(true);
      } else {
        throw new Error('Improper response data');
      }
    } catch (error) {
      console.error('Error in sending grid', error);
      alert('Could not process. Please try again later');
      setIsSubmitted(false);

    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isSubmitted && respData && respData['features'] && respData['flight_details']) {
      console.log('navigate');
      setIsSubmitted(false);
      navigate('/plot-features', {state: respData});
    } else {
      console.log('couldnt navigate');
    }
  }, [isSubmitted, respData, navigate]);
  useEffect(() => {
    
    const mapSource = new GeoTIFF({
      sources: [
        {
          url: process.env.REACT_APP_FILE_SERVER_URL+'/flights/'+flightDetails.cog_path,
          // url: 'http://localhost:8080/cog.tif',
          crossOrigin: 'anonymous',
          // projection: 'EPSG:4326'
        },
        
      ],
    });
    const vectorSource = new VectorSource();
    
    const map = new Map({
      target: mapRef.current,
      interactions: defaults().extend([new DragRotateAndZoom()]),
      layers: [
        new TileLayer({
          source: mapSource,
        }),
        new VectorLayer({
          source: vectorSource,
        })
      ],
      view: mapSource.getView(),
    });
    map.addControl(new ToggleDraw({'vector_source':vectorSource, 'map_reference':map}));
    map.addControl(new RotateMap({'direction': 'left'}));
    map.addControl(new RotateMap({'direction': 'right'}));
    
    setCoordinateFeatures((oldData) => ({
      ...oldData,
      'flight_id': flightDetails.flight_id,
    }));

    // Clean up the map when the component is unmounted
    return () => {
      map.setTarget(null);
    };
  }, [gridCols, gridRows, flightDetails]);
  
  
  const drawGrid = (source, map) => {
    function geoFunc() {
      return function (coordinates, geometry, projection) {
        const extent = boundingExtent(
          /** @type {LineCoordType} */ ([
            coordinates[0],
            coordinates[coordinates.length - 1],
          ]).map(function (coordinate) {
            return fromUserCoordinate(coordinate, projection);
          })
        );
        const boxCoordinates = [
          [
            getBottomLeft(extent),
            getBottomRight(extent),
            getTopRight(extent),
            getTopLeft(extent),
            getBottomLeft(extent),
          ],
        ];
        if (geometry) {
          geometry.setCoordinates(boxCoordinates);
        } else {
          geometry = new Polygon(boxCoordinates);
          
        }
        const userProjection = getUserProjection();
        if (userProjection) {
          geometry.transform(projection, userProjection);
        }
        let secondCorner;
        let fourthCorner;

        const firstCorner = coordinates[0];
        const thirdCorner = coordinates[1];

        const currentRotation = map.getView().getRotation();
        secondCorner = [thirdCorner[0], firstCorner[1]];
        fourthCorner = [firstCorner[0], thirdCorner[1]];
        if (currentRotation !== 0) {
          const verticesToRotate = new MultiPoint([secondCorner, fourthCorner]);
          const anchor = getCenter(verticesToRotate.getExtent());
          verticesToRotate.rotate(2* currentRotation, anchor);
          secondCorner = verticesToRotate.getCoordinates()[0];
          fourthCorner =  verticesToRotate.getCoordinates()[1];
        }
        const newCoordinates = [firstCorner, secondCorner, thirdCorner, fourthCorner, firstCorner];
        geometry.setCoordinates([newCoordinates]);
        // console.log('drawing ',newCoordinates);
        return geometry;
      };
    };
    gridDraw = new Draw({
      source: source,
      type: 'Circle',
      geometryFunction: geoFunc(),
    });

    map.addInteraction(gridDraw);
    
    gridDraw.on('drawend', (e) => {
      const currentRotation = map.getView().getRotation();
      e.feature.setStyle(getGridStyle(e.feature, gridCols, gridRows, 'red', currentRotation));
      map.removeInteraction(gridDraw);
      // console.log('total data', coordinateFeatures);

      const translate = new Translate({
        features: new Collection([e.feature]),
      });

      translate.on('translating', (ev) => {
        ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
      });
      translate.on('translateend', (ev) => {
        setCoordinateFeatures((oldData) => ({
          ...oldData,
          'box': [],
          'vertical': [],
          'horizontal': []
        }));
        // setCoordinateFeatures({});
        ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
      });
      map.addInteraction(translate);
    });
  };
  window.drawGrid = drawGrid;
  
  const getGridStyle = (feature, cols, rows, gridColor, currentRotation) => {
    setCoordinateFeatures((oldData) => ({
      ...oldData,
      'box': [],
      'vertical': [],
      'horizontal': []
    }));

    const styles = [];
    styles.push(
      new Style({
        stroke: new Stroke({
          color: gridColor,
          width: 2,
        }),
        fill: new Fill({
          color: 'transparent',
        }),
      })
    );
    const coords = feature.getGeometry().getCoordinates()[0];
    // console.log('get grid', coords);
    const topLeftCoord = coords[0];
    const topRightCoord = coords[1];
    const bottomRightCoord = coords[2];
    const bottomLeftCoord = coords[3];
    
    setCoordinateFeatures((oldData) => ({
      ...oldData,
      'box': coords,
    }));
    // setFinalBoxCoords(coords);

    const gridWidth = topRightCoord[0] - topLeftCoord[0];
    const colWidth = gridWidth / cols;
    
    const colXRotationOffset = (topLeftCoord[1] - topRightCoord[1])/cols;
    const xColCoord = [topLeftCoord[0] + colWidth, topLeftCoord[1] - colXRotationOffset];
    
    const colYRotationOffset = (bottomLeftCoord[1] - bottomRightCoord[1])/cols;
    const yColCoord = [bottomLeftCoord[0] + colWidth, bottomLeftCoord[1] - colYRotationOffset];
    
    let lineString;
    
    // vertical lines
    const verticalD = [];
    for (let i = 1; i <= cols - 1; i++) {
      // console.log(i, cols);
      lineString = new LineString([xColCoord, yColCoord]);

      const xColCopy = [...xColCoord];
      const yColCopy = [...yColCoord];

      setCoordinateFeatures((oldData) => ({
        ...oldData,
        vertical: oldData.vertical ? [...oldData.vertical, {'Point 1': xColCopy,'Point 2': yColCopy}] : [{'Point 1':xColCopy,'Point 2':yColCopy}],
      }));
      verticalD.push(([xColCopy, yColCopy]));
      styles.push(
        new Style({
          geometry: lineString,
          stroke: new Stroke({
            color: gridColor,
            width: 2,
          }),
        })
      );

      xColCoord[0] = xColCoord[0] + colWidth;
      xColCoord[1] = xColCoord[1] - colXRotationOffset;
      yColCoord[0] = yColCoord[0] + colWidth;
      yColCoord[1] = yColCoord[1] - colYRotationOffset;
      
    }
    // setVerticalData(verticalD);
    
    const gridHeight = bottomLeftCoord[1] - topLeftCoord[1];
    const rowHeight = gridHeight / rows;

    const rowXRotationOffset = (bottomLeftCoord[0] - topLeftCoord[0]) / rows;
    const xRowCoord = [topLeftCoord[0] + rowXRotationOffset, topLeftCoord[1] + rowHeight];

    const rowYRotationOffset = (topRightCoord[0] - bottomRightCoord[0]) / rows;
    const yRowCoord = [topRightCoord[0] - rowYRotationOffset, topRightCoord[1] + rowHeight];

    // horizontal lines
    for (let i = 1; i <= rows - 1; i++) {
      lineString = new LineString([xRowCoord, yRowCoord]);

      const xRowCopy = [...xRowCoord];
      const yRowCopy = [...yRowCoord];

      setCoordinateFeatures((oldData) => ({
        ...oldData,
        horizontal: oldData.horizontal ? [...oldData.horizontal, {'Point 1': xRowCopy,'Point 2': yRowCopy}] : [{'Point 1':xRowCopy,'Point 2':yRowCopy}],
      }));
      
      styles.push(
        new Style({
          geometry: lineString,
          stroke: new Stroke({
            color: gridColor,
            width: 2,
          }),
        })
      );

      xRowCoord[0] = xRowCoord[0] + rowXRotationOffset;
      xRowCoord[1] = xRowCoord[1] + rowHeight;
      yRowCoord[0] = yRowCoord[0] - rowYRotationOffset;
      yRowCoord[1] = yRowCoord[1] + rowHeight;
    }
    // console.log(styles);
    return styles;
  };
  return (
    <Box
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100px'
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={12} md={12} lg={12} id="map" ref={mapRef} style={{ width: '100%', height: '400px' }} />
        <Grid item xs={12} sm={6} md={6} lg={6} >
          <FormControl fullWidth style={{display: 'flex', flexDirection:'row'}}>
              <InputLabel id='walkPatternLabel'>What is your data collection method?</InputLabel>
              <Select fullWidth
                  labelId='walkPatternLabel'
                  id='walkPatternSelect'
                  value={walkPattern}
                  onChange={(e) => setWalkPattern(e.target.value)}
                  sx={{mb:2, ml:1}}>
                  <MenuItem value={'dh'}>Deadheaded</MenuItem>
                  <MenuItem value={'st'}>Serpentine</MenuItem>
              </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={6} lg={6} >
          <FormControl fullWidth style={{display: 'flex', flexDirection:'row'}}>
            <InputLabel id='walkStartLabel'>Where did you start collecting data from?</InputLabel>
            <Select fullWidth
              labelId='walkStartLabel'
              id='walkStartSelect'
              value={walkStartLocation}
              // label='Crop Type'
              // onChange={handleCropTypeChange}
              onChange={(e) => setWalkStartLocation(e.target.value)}
              sx={{mb:2, mr: 1}}>
              <MenuItem value={'tl'}>Top left corner</MenuItem>
              <MenuItem value={'tr'}>Top right corner</MenuItem>
              <MenuItem value={'bl'}>Bottom left corner</MenuItem>
              <MenuItem value={'br'}>Bottom right corner</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={6} align='left' sx={{mb:1}}>
          <FieldFeatureModal setFieldFeatures={handleFieldFeaturesUpdate}></FieldFeatureModal>
        </Grid>
        <Grid item xs={6} sm={6} md={6} lg={6} align='right' sx={{mb:1}}>
          <Button onClick={sendGrid}>NEXT</Button>
          <Modal
            open={loading}
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '50%',
                height: '50%',
                backgroundColor: 'white',
                boxShadow: 24,
                p: 4,
                borderRadius: '8px',
                textAlign: 'center',
                maxHeight: '100px',
              }}
            >
              <CircularProgress />
              <Typography>Calculating vegetation indices</Typography>
            </Box>
          </Modal>
        </Grid> 
        
      </Grid>
      
    </Box>
  );
};

export default GeoTIFFMap;
