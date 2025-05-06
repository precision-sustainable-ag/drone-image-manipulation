import geoUtils from "./geoUtils";

/**
 * Generates a grid of plot coordinates based on a given baseline and specified dimensions.
 * Each grid cell represents a plot in the grid.
 * 
 * @param {Array} line An array containing the start and end coordinates of the baseline in the format [[lon1, lat1], [lon2, lat2]].
 * @param {number} gridCols Number of columns (plots per row) in the grid.
 * @param {number} gridRows Number of rows (plots per column) in the grid.
 * @param {number} plotLength Length of each plot (in meters).
 * @param {number} plotWidth Width of each plot (in meters).
 * @param {number} lengthAlleywaySize Size of the alleyways separating the plots along the length (in meters).
 * @param {number} widthAlleywaySize Size of the alleyways separating the plots along the width (in meters).
 * @returns {Array} A 2D array of polygons, where each polygon represents a plot with its corner coordinates.
 */
const createGrid = (
  line,
  gridCols,
  gridRows,
  plotLength,
  plotWidth,
  lengthAlleywaySize,
  widthAlleywaySize,
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
  const lengthAlleySizeMeters = lengthAlleywaySize;
  const widthAlleySizeMeters = widthAlleywaySize;
  // const width = (lineLengthMeters - (cols - 1) * alleySizeMeters) / cols;
  const length = plotLength;
  const width = plotWidth;
  // console.log(rows, cols, alleySizeMeters, length, width);

  const gridCells = [];

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Calculate offsets in meters
      const rightOffsetMeters = j * (width + widthAlleySizeMeters);
      const downOffsetMeters = i * (length + lengthAlleySizeMeters);

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

/**
 * Reorders the generated grid based on the desired numbering method and starting position.
 * 
 * @param {Array} grid The generated grid array where each element represents a plot.
 * @param {number} gridRows Number of rows in the grid.
 * @param {number} gridCols Number of columns in the grid.
 * @param {string} method Numbering method: "dh" (deadheaded) or "st" (serpentine).
 * @param {string} start Starting position: 
 *                          "tl" (top-left), "tr" (top-right),
 *                          "bl" (bottom-left), "br" (bottom-right).
 * @returns {Array} The reordered grid with plots numbered according to the given method and starting position.
 */
const reorderGrid = (grid, gridRows, gridCols, method, start) => {
  const rows = gridRows;
  const cols = gridCols;
  let orderedGrid = [];

  // Convert flat grid array to 2D array
  let grid2D = [];
  for (let i = 0; i < rows; i++) {
    grid2D.push(grid.slice(i * cols, (i + 1) * cols));
  }

  /**
   * If numbering starts from right, reverse each row
   * If numbering starts from bottom, reverse each row order
   * If numbering pattern is serpentine, reverse all odd numbered rows
   */
  if (start === "tr" || start === "br") {
    grid2D = grid2D.map((row) => row.reverse());
  }
  if (start === "bl" || start === "br") {
    grid2D.reverse();
  }
  if (method === "st") {
    grid2D.forEach((row, i) => {
      if (i % 2 !== 0) row.reverse();
    });
  }

  orderedGrid = grid2D.flat();
  return orderedGrid;
};

export {createGrid, reorderGrid};
