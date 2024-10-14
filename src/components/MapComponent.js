import { useEffect, useRef } from "react";
import { Map } from "ol";
import WebGLTileLayer from "ol/layer/WebGLTile";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { defaults as defaultControls } from "ol/control";

const MapComponent = ({
  mapSource,
  vectorLayer,
  controls,
  interactions,
  view,
  onMapInit,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !mapSource || !vectorLayer) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new WebGLTileLayer({
          source: mapSource,
        }),
        vectorLayer,
      ],
      controls: defaultControls().extend(controls),
      interactions: interactions || defaultInteractions().extend([new DragRotateAndZoom()]),
      view: view ? view : mapSource?.getView(),
    });

    mapInstanceRef.current = map;

    if (onMapInit) {
      onMapInit(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, [mapSource, vectorLayer, controls, interactions, view, onMapInit]);

  return (
    <div
      className="map"
      ref={mapRef}
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default MapComponent;
