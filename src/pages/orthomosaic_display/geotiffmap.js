import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Button, FormControl, FormLabel,
  Grid, InputLabel, RadioGroup, Radio,
  Select, TextField, Typography, Modal, MenuItem, FormControlLabel } from '@mui/material';

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

  const handleFieldFeaturesUpdate = (newData) => {
    setFieldFeatures(newData);
  };

  const sendGrid = async () => {
    
    // TODO: error handling, loading modal
    // TODO: sending field features
    // setCoordinateFeatures((oldData) => ({
    //   ...oldData,
    //   'data_collection_method': {
    //     'start_point': walkStartLocation,
    //     'pattern': walkPattern,
    //   },
    // }));
    const requestData = {
      'flight_id': coordinateFeatures['flight_id'],
      'coordinate_features': coordinateFeatures,
      'data_collection_method': {
        'start_point': walkStartLocation,
        'pattern': walkPattern,
      },
      'field_features': fieldFeatures
    }
    console.log('tehee ',coordinateFeatures);
    console.log('tehee2', fieldFeatures);
    try {
      const response = await axios.post('http://localhost:5000/setGrid', requestData, 
      { headers: {
        'Content-Type': 'application/json',
      }});
      console.log(response.data);
      navigate('/plot-features', {state : response.data} );
      // history.push('/plot-features');
    } catch (error) {
      console.log(error);
    }
  }
  // valid till Feb 11th
  // cog.tif -> https://ncsudronedata.blob.core.windows.net/test/cog.tif?sp=r&st=2024-02-29T20:59:58Z&se=2024-03-30T03:59:58Z&spr=https&sv=2022-11-02&sr=b&sig=XSquPt1XLVps%2BqJCHMY4Z7VfqJKr6jZnzrLlp30rkdc%3D
  // 0002SET_ortho_cog.tif -> https://ncsudronedata.blob.core.windows.net/test/0002SET_ortho_cog.tif?sp=r&st=2024-02-29T20:59:02Z&se=2024-03-30T03:59:02Z&spr=https&sv=2022-11-02&sr=b&sig=XPbQkWDEsOHJk9EoOhb8RaY3cP5n1OzdioAUJq0Thew%3D
  
  useEffect(() => {
    
    const mapSource = new GeoTIFF({
      sources: [
        {
          url: flightDetails.orthomosaic_url,
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
    console.log('get grid', coords);
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
      console.log('vertical push', xColCoord, yColCoord);
      verticalD.push(([xColCopy, yColCopy]));
      console.log('loop V', verticalD);
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
      console.log('after: ', xColCoord, yColCoord);
    }
    // console.log('internal V', verticalD);
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
      console.log('horizontal push', xRowCoord, yRowCoord);
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
                  sx={{mb:2, ml:1}}
              >
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
                  sx={{mb:2, mr: 1}}
              >
                  <MenuItem value={'tl'}>Top left corner</MenuItem>
                  <MenuItem value={'tr'}>Top right corner</MenuItem>
                  <MenuItem value={'bl'}>Bottom left corner</MenuItem>
                  <MenuItem value={'br'}>Bottom right corner</MenuItem>
              </Select>
          </FormControl>
          </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12} align='right'>
          <FieldFeatureModal setFieldFeatures={handleFieldFeaturesUpdate}></FieldFeatureModal>
        </Grid>
        <Grid item xs={12} sm={12} md={12} lg={12} align='right'>
          <Button onClick={sendGrid}>NEXT</Button>
        </Grid> 
        
      </Grid>
      
    </Box>
  );
};

export default GeoTIFFMap;
