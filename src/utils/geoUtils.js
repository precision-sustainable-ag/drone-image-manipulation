const earthRadius = 6378137; // Earth's radius in meters

// Convert degrees to radians
const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;

// Convert longitude difference to meters at this latitude
const lonToMeters = (lonDiff, lat) => {
  return earthRadius * toRadians(lonDiff) * Math.cos(toRadians(lat));
};

// Convert latitude difference to meters
const latToMeters = (latDiff) => {
  return earthRadius * toRadians(latDiff);
};

// Calculate cell size in meters
const lineLengthMeters = (dxMeters, dyMeters) => {
  return Math.sqrt(dxMeters * dxMeters + dyMeters * dyMeters);
};

// Convert meters to longitude difference at this latitude
const metersToLon = (meters, lat) => {
  return toDegrees(meters / (earthRadius * Math.cos(toRadians(lat))));
};

// Convert meters to latitude difference
const metersToLat = (meters) => {
  return toDegrees(meters / earthRadius);
};

const geoUtils = {
  toRadians,
  toDegrees,
  lineLengthMeters,
  lonToMeters,
  latToMeters,
  metersToLon,
  metersToLat,
};

export default geoUtils;
