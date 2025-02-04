import geoUtils from "./geoUtils";

const createGrid = (
  line,
  gridCols,
  gridRows,
  plotLength,
  plotWidth,
  alleywaySize
) => {
  if (!line || line.length !== 2) {
    console.error("LineString must have exactly two points.");
    return;
  }

  const [start, end] = line;

  // Calculate center latitude for distance calculations
  const centerLat = (start[1] + end[1]) / 2;

  // Convert differences to meters
  const dxMeters = geoUtils.lonToMeters(end[0] - start[0], centerLat);
  const dyMeters = geoUtils.latToMeters(end[1] - start[1]);

  // Calculate angle in meters-based coordinate system
  const angle = Math.atan2(dyMeters, dxMeters);

  const rows = gridRows;
  const cols = gridCols;
  const alleySizeMeters = alleywaySize;
  // const width = (lineLengthMeters - (cols - 1) * alleySizeMeters) / cols;
  const length = plotLength;
  const width = plotWidth;
  // console.log(rows, cols, alleySizeMeters, length, width);

  const gridCells = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Calculate offsets in meters
      const rightOffsetMeters = j * (width + alleySizeMeters);
      const downOffsetMeters = i * (length + alleySizeMeters);

      // Calculate displacements in meters. Change signs to flip the direction
      const eastDisplacement =
        rightOffsetMeters * Math.cos(angle) +
        downOffsetMeters * Math.sin(angle);
      const northDisplacement =
        rightOffsetMeters * Math.sin(angle) -
        downOffsetMeters * Math.cos(angle);

      // Convert base point back to lon/lat
      const baseLon =
        start[0] + geoUtils.metersToLon(eastDisplacement, centerLat);
      const baseLat = start[1] + geoUtils.metersToLat(northDisplacement);

      // Calculate cell corners
      const rightMeters = width * Math.cos(angle);
      const upMeters = width * Math.sin(angle);

      // Convert displacements to lon/lat differences
      const rightLon = geoUtils.metersToLon(rightMeters, centerLat);
      const rightLat = geoUtils.metersToLat(upMeters);
      // Change signs for downward direction
      const downLon = geoUtils.metersToLon(length * Math.sin(angle), centerLat);
      const downLat = geoUtils.metersToLat(-length * Math.cos(angle));

      gridCells.push([
        [baseLon, baseLat],
        [baseLon + rightLon, baseLat + rightLat],
        [baseLon + rightLon + downLon, baseLat + rightLat + downLat],
        [baseLon + downLon, baseLat + downLat],
        [baseLon, baseLat],
      ]);
    }
  }
  return gridCells;
};

export default createGrid;
