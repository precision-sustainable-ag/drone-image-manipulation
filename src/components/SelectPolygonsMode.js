import * as turf from "@turf/turf";

/**
 * Select Polygons Mode
 * ------------------
 * A custom mode for Mapbox Draw that allows users to select multiple polygons
 * by drawing a selection rectangle.
 *
 * - Click once to set the starting point of the rectangle.
 * - Drag the mouse and click again to complete the rectangle. and select all intersecting polygons.
 * - The mode selects all intersecting polygons switches back to `simple_select` mode.
 * - Exit out of the mode by pressing the Escape key (ESC).
 */
const SelectPolygonsMode = {
  onSetup: function () {
    var selectionRectangle = this.newFeature({
      type: "Feature",
      properties: {
        active: true,
        name: "selection-rectangle",
      },
      geometry: {
        type: "Polygon",
        coordinates: [[]],
      },
    });
    this.updateUIClasses({ mouse: "add" });
    return {
      selectionRectangle: selectionRectangle,
      startPoint: null,
      selectedPolygonIds: [...this.getSelectedIds()],
    };
  },

  onClick: function (state, e) {
    if (!state.startPoint) {
      this.updateUIClasses({ mouse: "add" });
      this.addFeature(state.selectionRectangle);
      state.startPoint = e.lngLat;
    } else {
      const endPoint = e.lngLat;
      const selectionRectanglePolygon = this.createAlignedSelectionRectangle(
        state.startPoint,
        endPoint
      );
      state.startPoint = e.lngLat;
      this.selectIntersectingPolygons(state, selectionRectanglePolygon);
      this.changeMode("simple_select", {
        featureIds: state.selectedPolygonIds,
      });
    }
  },

  onMouseMove: function (state, e) {
    this.updateUIClasses({ mouse: "add" });
    if (state.startPoint) {
      const newCoordinates = this.createAlignedSelectionRectangle(
        state.startPoint,
        e.lngLat
      );
      state.selectionRectangle.setCoordinates(newCoordinates);
    }
  },

  /**
   * Selects all polygons that intersect with the drawn selection rectangle.
   *
   * @param {Object} state - The current mode state, storing selected features.
   * @param {Array} selectionRectanglePolygon - The coordinates of the selection rectangle as a Turf.js-compatible polygon.
   */
  selectIntersectingPolygons: function (state, selectionRectanglePolygon) {
    const selectionPolygon = turf.polygon(selectionRectanglePolygon);

    // Get all features from the draw layer
    const allFeatures = this._ctx.api.getAll().features;
    allFeatures.forEach((feature) => {
      if (
        feature.properties &&
        feature.properties.name === "selection-rectangle"
      )
        return;

      if (feature.geometry.type === "Polygon") {
        const featurePolygon = turf.polygon(feature.geometry.coordinates);
        if (turf.booleanIntersects(selectionPolygon, featurePolygon)) {
          state.selectedPolygonIds.push(feature.id);
        }
      }
    });
  },

  /**
   * Creates a selection rectangle aligned with the screen, considering map rotation.
   * @param {Object} startPoint - The initial click point (lngLat).
   * @param {Object} endPoint - The second click point (lngLat).
   * @returns {Array} Polygon coordinates for the selection rectangle.
   */
  createAlignedSelectionRectangle: function (startPoint, endPoint) {
    // Convert geographic coordinates to screen coordinates
    const startScreen = this.map.project(startPoint);
    const endScreen = this.map.project(endPoint);

    // Define screen-space bounding box
    const minX = Math.min(startScreen.x, endScreen.x);
    const maxX = Math.max(startScreen.x, endScreen.x);
    const minY = Math.min(startScreen.y, endScreen.y);
    const maxY = Math.max(startScreen.y, endScreen.y);

    // Create rectangle corners in screen space
    const topLeft = { x: minX, y: minY };
    const topRight = { x: maxX, y: minY };
    const bottomRight = { x: maxX, y: maxY };
    const bottomLeft = { x: minX, y: maxY };

    // Convert back to geographic coordinates
    const geoTopLeft = this.map.unproject(topLeft);
    const geoTopRight = this.map.unproject(topRight);
    const geoBottomRight = this.map.unproject(bottomRight);
    const geoBottomLeft = this.map.unproject(bottomLeft);

    // Return as polygon coordinates
    return [
      [
        [geoTopLeft.lng, geoTopLeft.lat],
        [geoTopRight.lng, geoTopRight.lat],
        [geoBottomRight.lng, geoBottomRight.lat],
        [geoBottomLeft.lng, geoBottomLeft.lat],
        [geoTopLeft.lng, geoTopLeft.lat],
      ],
    ];
  },

  onKeyUp: function (state, e) {
    if (e.keyCode === 27) {
      this.updateUIClasses({ mouse: "none" });
      return this.changeMode("simple_select", {
        featureIds: state.selectedPolygonIds,
      });
    }
  },

  onStop: function (state) {
    // Clean up the selection rectangle
    if (state.selectionRectangle && state.selectionRectangle.id) {
      this.deleteFeature([state.selectionRectangle.id], { silent: true });
    }
  },

  toDisplayFeatures: function (state, geojson, display) {
    if (
      state.selectionRectangle &&
      geojson.properties.id === state.selectionRectangle.id
    ) {
      geojson.properties.active = "true";
    }

    if (state.selectedPolygonIds.includes(geojson.properties.id)) {
      geojson.properties.active = "true";
    }

    display(geojson);
  },
};

export default SelectPolygonsMode;
