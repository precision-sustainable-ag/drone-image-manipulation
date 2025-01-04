import { useEffect, useRef } from "react";
import { Map } from "ol";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { defaults as defaultControls } from "ol/control";

const MapComponent = ({
  mapLayers,
  controls,
  interactions,
  view,
  onMapInit,
  mapSize = { width: "100%", height: "100vh" }
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !mapLayers) return;

    const map = new Map({
      target: mapRef.current,
      layers: mapLayers,
      controls: defaultControls().extend(controls),
      interactions: interactions || defaultInteractions().extend([new DragRotateAndZoom()]),
      view: view ? view : mapLayers[0]?.getSource().getView(),
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
  }, [mapLayers, controls, interactions, view, onMapInit]);

  return (
    <div
      className="map"
      ref={mapRef}
      style={mapSize}
    />
  );
};

export default MapComponent;
