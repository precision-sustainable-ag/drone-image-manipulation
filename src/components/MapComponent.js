import { useEffect, useRef } from "react";
import { Map } from "ol";
import WebGLTileLayer from "ol/layer/WebGLTile";
import Layer from "ol/layer/Layer";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { defaults as defaultControls } from "ol/control";

const MapComponent = ({
  mapSources,
  vectorLayer,
  controls,
  interactions,
  view,
  onMapInit,
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !mapSources || !vectorLayer) return;

    const sourceArray = Array.isArray(mapSources) ? mapSources : [mapSources];
    
    const tileLayers = sourceArray.map(source => {
      // If source is already a Layer instance (TileLayer, etc), use it directly
      if (source instanceof Layer) {
        return source;
      }
      // Otherwise, create a new WebGLTileLayer (maintaining backward compatibility)
      return new WebGLTileLayer({
        source: source,
      });
    });


    const map = new Map({
      target: mapRef.current,
      layers: [
        tileLayers,
        vectorLayer,
      ],
      controls: defaultControls().extend(controls),
      interactions: interactions || defaultInteractions().extend([new DragRotateAndZoom()]),
      view: view ? view : sourceArray[0]?.getView(),
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
  }, [mapSources, vectorLayer, controls, interactions, view, onMapInit]);

  return (
    <div
      className="map"
      ref={mapRef}
      style={{ width: "100%", height: "400px" }}
    />
  );
};

export default MapComponent;
