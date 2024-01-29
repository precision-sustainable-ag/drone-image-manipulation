import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Button, Box, Grid} from '@mui/material';

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

  const sendGrid = async () => {
    // const history = useHistory();
    // console.log('button', orthoUrl);
    
    // TODO: error handling, loading modal
    console.log('tehee ',coordinateFeatures);
    try {
      const response = await axios.post('http://localhost:5000/setGrid', coordinateFeatures, 
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
  // cog.tif -> https://ncsudronedata.blob.core.windows.net/test/cog.tif?sp=r&st=2024-01-17T16:06:21Z&se=2024-02-11T00:06:21Z&spr=https&sv=2022-11-02&sr=b&sig=yxpfE7aeKZyTtmXgqHXhOzswTI2tq6jpVPZaUGha68s%3D
  // 0002SET_ortho_cog.tif -> https://ncsudronedata.blob.core.windows.net/test/0002SET_ortho_cog.tif?sp=r&st=2024-01-17T16:57:01Z&se=2024-02-12T00:57:01Z&spr=https&sv=2022-11-02&sr=b&sig=hYcRxIQ9W1Cw7oW6RFuvDDHCUnd6DR6E4XqFA41EAEo%3D
  
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
        // console.log(geometry.getExtent());
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
    for (let i = 1; i <= cols - 1; i++) {
      lineString = new LineString([xColCoord, yColCoord]);
      setCoordinateFeatures((oldData) => ({
        ...oldData,
        vertical: oldData.vertical ? [...oldData.vertical, {'Point 1': xColCoord,'Point 2': yColCoord}] : [{'Point 1':xColCoord,'Point 2':yColCoord}],
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

      xColCoord[0] = xColCoord[0] + colWidth;
      xColCoord[1] = xColCoord[1] - colXRotationOffset;
      yColCoord[0] = yColCoord[0] + colWidth;
      yColCoord[1] = yColCoord[1] - colYRotationOffset;
    }
    
    const gridHeight = bottomLeftCoord[1] - topLeftCoord[1];
    const rowHeight = gridHeight / rows;

    const rowXRotationOffset = (bottomLeftCoord[0] - topLeftCoord[0]) / rows;
    const xRowCoord = [topLeftCoord[0] + rowXRotationOffset, topLeftCoord[1] + rowHeight];

    const rowYRotationOffset = (topRightCoord[0] - bottomRightCoord[0]) / rows;
    const yRowCoord = [topRightCoord[0] - rowYRotationOffset, topRightCoord[1] + rowHeight];

    // horizontal lines
    for (let i = 1; i <= rows - 1; i++) {
      lineString = new LineString([xRowCoord, yRowCoord]);
      setCoordinateFeatures((oldData) => ({
        ...oldData,
        horizontal: oldData.horizontal ? [...oldData.horizontal, {'Point 1': xRowCoord,'Point 2': yRowCoord}] : [{'Point 1':xRowCoord,'Point 2':yRowCoord}],
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
        <Grid item xs={12} sm={12} md={12} lg={12} align='right'>
          <Button onClick={sendGrid}>yessir</Button>
        </Grid>
      </Grid>
      
    </Box>
  );
};

export default GeoTIFFMap;
