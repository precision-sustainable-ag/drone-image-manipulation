import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import GeoTIFF from 'ol/source/GeoTIFF';
import TileLayer from 'ol/layer/WebGLTile';
import {toLonLat} from 'ol/proj';
import { Draw, Modify, Snap } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import { getBottomLeft, getTopLeft, getTopRight, getBottomRight } from 'ol/extent';
import {Style, Stroke, Fill} from 'ol/style';
import DragRotateAndZoom  from 'ol/interaction/DragRotateAndZoom';
import { defaults } from 'ol/interaction/defaults';
import {Control} from 'ol/control';
import { Polygon, MultiPoint} from 'ol/geom';
import { getCenter } from 'ol/extent';
import { boundingExtent } from 'ol/extent';
import { fromUserCoordinate, getUserProjection } from 'ol/proj';
import Translate from 'ol/interaction/Translate';
import { Collection } from 'ol';
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

    this.vectorSource = options['vs'];
    this.mapRef = options['mr'];
    // this.map = map;
    
    button.addEventListener('click', this.handleToggleDraw.bind(this), false);
  }
  handleToggleDraw() {
    window.drawGrid(this.vectorSource, this.mapRef);
  }
}

const GeoTIFFMap = ({gridCols, gridRows}) => {
  const mapRef = useRef(null);
  let gridDraw;

  useEffect(() => {
    const mapSource = new GeoTIFF({
      sources: [
        {
          url: 'https://ncsudronedata.blob.core.windows.net/test/cog.tif?sp=r&st=2024-01-16T16:31:55Z&se=2024-01-17T00:31:55Z&spr=https&sv=2022-11-02&sr=b&sig=6eyKOwRJ%2BGrkJ6WowWXZuNM2wA2xMAXPq6j0EelxD5o%3D',
          crossOrigin: 'anonymous'
        },
        
      ],
      // projection:proj,
    });
    const vectorSource = new VectorSource();
    
    // const centerCoordinates = toLonLat([621082.8863332459, 3894560.1348702004]);
    // const centerEPSG = [-79.67,35.18];
    // const tog = new ToggleDraw({vectorSource:vectorSource});
    
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
    map.addControl(new ToggleDraw({'vs':vectorSource, 'mr':map}));
    // if (toggleGridDraw){
    // drawGrid(vectorSource,map);
    // }
    // console.log(map);
    

    // Clean up the map when the component is unmounted
    return () => {
      map.setTarget(null);
    };
  }, [gridCols, gridRows]);
  
  
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
          // const center = getCenter(geometry.getExtent());
          // const angle = map.getView().getRotation();
          // console.log(angle);
          // geometry.rotate(angle, center);
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
        console.log(geometry.getExtent());
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
      // console.log('drawend', e.feature);
      e.feature.setStyle(getGridStyle(e.feature, gridCols, gridRows, 'red', currentRotation));
      map.removeInteraction(gridDraw);

      const translate = new Translate({
        features: new Collection([e.feature]),
      });

      translate.on('translating', (ev) => {
        ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
      });
      translate.on('translateend', (ev) => {
        ev.features.getArray()[0].setStyle(getGridStyle(ev.features.getArray()[0], gridCols, gridRows, 'red', currentRotation));
      });
      map.addInteraction(translate);
    });
  };
  window.drawGrid = drawGrid;
  
  const getGridStyle = (feature, cols, rows, gridColor, currentRotation) => {
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
    
    console.log(feature.getGeometry().getExtent());
    // const extent = feature.getGeometry().getExtent();
    // const bottomLeftCoord = getBottomLeft(extent);
    // const topLeftCoord = getTopLeft(extent);
    // const topRightCoord = getTopRight(extent);
    // console.log(feature.getGeometry().getCoordinates());
    // console.log(topLeftCoord);
    const coords = feature.getGeometry().getCoordinates()[0];
    const topLeftCoord = coords[0];
    const topRightCoord = coords[1];
    const bottomRightCoord = coords[2];
    const bottomLeftCoord = coords[3];
    console.log(coords);

    const gridWidth = topRightCoord[0] - topLeftCoord[0];
    const colWidth = gridWidth / cols;
    
    const colXRotationOffset = (topLeftCoord[1] - topRightCoord[1])/cols;
    const xColCoord = [topLeftCoord[0] + colWidth, topLeftCoord[1] - colXRotationOffset];
    
    const colYRotationOffset = (bottomLeftCoord[1] - bottomRightCoord[1])/cols;
    const yColCoord = [bottomLeftCoord[0] + colWidth, bottomLeftCoord[1] - colYRotationOffset];
    
    let lineString;
    for (let i = 1; i <= cols - 1; i++) {
      lineString = new LineString([xColCoord, yColCoord]);
      // const anchor = getCenter(lineString.getExtent());
      // lineString.rotate(2* currentRotation, anchor);

      styles.push(
        new Style({
          geometry: lineString,
          // geometry: new LineString([xColCoord, yColCoord]),
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

    for (let i = 1; i <= rows - 1; i++) {
      styles.push(
        new Style({
          geometry: new LineString([xRowCoord, yRowCoord]),
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
    console.log(styles);
    return styles;
  };
  return (
    <div>
      <div id="map" ref={mapRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default GeoTIFFMap;
