import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';

import { Collection } from 'ol';
import GeoTIFF from 'ol/source/GeoTIFF';
import { Draw } from 'ol/interaction';
import Translate from 'ol/interaction/Translate';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import LineString from 'ol/geom/LineString';
import { getBottomLeft, getTopLeft, getTopRight, getBottomRight, getCenter, boundingExtent } from 'ol/extent';
import {Style, Stroke, Fill} from 'ol/style';
import { Polygon, MultiPoint} from 'ol/geom';
import { fromUserCoordinate, getUserProjection } from 'ol/proj';

import 'ol/ol.css';
import '../../styles/App.css';
import MapComponent from '../../components/MapComponent';
import { RotateMap, ToggleDraw } from '../../components/MapControls';

// TODO: Change the default EPSG:3857 projection to EPSG:4326
const GeoTIFFMap = ({gridCols, gridRows, flightDetails, setCoordinateFeatures}) => {

  let gridDraw;
  const [vectorLayer, setVectorLayer] = useState(null);
  const [controls, setControls] = useState([]);

  useEffect(() => {
    if (!flightDetails) return;

    const mapSource = new GeoTIFF({
      sources: [
        {
          url: process.env.REACT_APP_API_URL+'/data/'+flightDetails.cog_path,
          // url: 'http://localhost:8080/cog.tif',
          crossOrigin: 'anonymous',
          // projection: 'EPSG:4326'
        },
      ],
    });
    const tileLayer = new WebGLTileLayer({source: mapSource});
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });
    const controls = [
      new ToggleDraw({
        vector_source: vectorSource,
        clearData: () => {
          setCoordinateFeatures({'flight_id': flightDetails.flight_id});
        },
      }),
      new RotateMap({ direction: "left" }),
      new RotateMap({ direction: "right" }),
    ];

    setVectorLayer([tileLayer, vectorLayer]);
    setControls(controls);

    setCoordinateFeatures((oldData) => ({
      ...oldData,
      'flight_id': flightDetails.flight_id,
    }));

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
      setCoordinateFeatures((oldData) => ({
        ...oldData,
        'rotation': currentRotation,
      }));

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
    return gridDraw;
  };
  window.drawHandler = drawGrid;
  
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
    const verticalD = [];
    for (let i = 1; i <= cols - 1; i++) {
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
    return styles;
  };

  return (
    <Box
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <MapComponent
        mapLayers={vectorLayer}
        controls={controls}
        mapSize={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default GeoTIFFMap;
