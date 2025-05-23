import * as Cesium from 'cesium';
import type * as satellite from 'satellite.js';
import { getSatellitePosition, MIN_ELEVATION_DEG, EARTH_RADIUS_KM } from './coverage-utils';

/**
 * Calculate the coverage radius on Earth's surface for a satellite
 * @param satelliteHeight Height of satellite above Earth in km
 * @param minElevationDeg Minimum elevation angle in degrees
 * @returns Coverage radius in kilometers
 */
export function calculateCoverageRadius(satelliteHeight: number, minElevationDeg = MIN_ELEVATION_DEG): number {
  const minElevationRad = minElevationDeg * (Math.PI / 180);
  
  // Using spherical Earth approximation
  // Coverage radius = sqrt(h^2 + 2*R*h) * cos(elevation + asin(R*cos(elevation)/(R+h)))
  // Simplified for small elevation angles: radius ≈ sqrt(h * (2*R + h)) 
  
  const R = EARTH_RADIUS_KM;
  const h = satelliteHeight;
  
  // Calculate the horizon distance (simplified)
  const horizonDistance = Math.sqrt(h * (2 * R + h));
  
  // Adjust for minimum elevation angle
  const adjustedRadius = horizonDistance * Math.cos(minElevationRad);
  
  return adjustedRadius;
}

/**
 * Create a circular coverage polygon for a satellite using proper spherical geometry
 * @param center Center position of coverage (lat, lng in degrees)
 * @param radiusKm Coverage radius in kilometers
 * @param segments Number of polygon segments (default: 32)
 * @returns Array of Cartesian3 positions for the polygon
 */
export function createCoveragePolygon(
  center: { lat: number; lng: number }, 
  radiusKm: number, 
  segments = 32
): Cesium.Cartesian3[] {
  const positions: Cesium.Cartesian3[] = [];
  
  // Convert to radians
  const centerLatRad = center.lat * Math.PI / 180;
  const centerLngRad = center.lng * Math.PI / 180;
  
  // Calculate angular radius (distance from center to edge of circle on sphere)
  const angularRadius = radiusKm / EARTH_RADIUS_KM;
  
  for (let i = 0; i <= segments; i++) {
    const bearing = (i / segments) * 2 * Math.PI; // 0 to 2π
    
    // Use proper spherical trigonometry to calculate point on great circle
    // Formula for destination point given distance and bearing
    const lat = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularRadius) +
      Math.cos(centerLatRad) * Math.sin(angularRadius) * Math.cos(bearing)
    );
    
    const lng = centerLngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularRadius) * Math.cos(centerLatRad),
      Math.cos(angularRadius) - Math.sin(centerLatRad) * Math.sin(lat)
    );
    
    // Convert back to degrees
    const latDeg = lat * 180 / Math.PI;
    const lngDeg = lng * 180 / Math.PI;
    
    // Normalize longitude to [-180, 180]
    const normalizedLng = ((lngDeg + 180) % 360) - 180;
    
    // Convert to Cartesian3
    const position = Cesium.Cartesian3.fromDegrees(normalizedLng, latDeg, 0);
    positions.push(position);
  }
  
  return positions;
}

/**
 * Add coverage visualization for a single satellite to Cesium viewer
 * @param viewer Cesium viewer instance
 * @param satelliteId Unique ID for the satellite
 * @param satrec Satellite record from satellite.js
 * @param color Color for the coverage zone
 * @param timestamp Time to calculate coverage for
 * @returns Entity ID of the created coverage zone
 */
export function addSatelliteCoverageZone(
  viewer: Cesium.Viewer,
  satelliteId: string,
  satrec: satellite.SatRec,
  color: Cesium.Color,
  timestamp = new Date()
): string | null {
  try {
    // Get satellite position
    const satPos = getSatellitePosition(satrec, timestamp);
    if (!satPos) {
      console.warn(`Could not get position for satellite ${satelliteId}`);
      return null;
    }
    
    // Calculate coverage radius
    const coverageRadius = calculateCoverageRadius(satPos.height, MIN_ELEVATION_DEG);
    
    // Create coverage polygon
    const polygonPositions = createCoveragePolygon(
      { lat: satPos.lat, lng: satPos.lng },
      coverageRadius
    );
    
    // Create coverage zone entity ID
    const coverageEntityId = `coverage-${satelliteId}`;
    
    // Remove existing coverage zone if it exists
    if (viewer.entities.getById(coverageEntityId)) {
      viewer.entities.removeById(coverageEntityId);
    }
    
    // Add coverage zone entity
    viewer.entities.add({
      id: coverageEntityId,
      name: `Coverage Zone - ${satelliteId}`,
      polygon: {
        hierarchy: polygonPositions,
        material: color.withAlpha(0.4), // Increased to 40% opacity
        outline: true,
        outlineColor: color.withAlpha(0.8),
        height: 0,
        extrudedHeight: 0,
      },
    });
    
    // Only log during initial creation (less spam)
    // console.log(`Added coverage zone for ${satelliteId}: ${coverageRadius.toFixed(1)}km radius`);
    return coverageEntityId;
    
  } catch (error) {
    console.error(`Error adding coverage zone for ${satelliteId}:`, error);
    return null;
  }
}

/**
 * Add coverage visualization for all satellites in a constellation
 * @param viewer Cesium viewer instance
 * @param satellites Array of satellite records with individual colors
 * @param colors Array of colors for different satellites (should match satellites array)
 * @param timestamp Time to calculate coverage for
 * @returns Array of created coverage entity IDs
 */
export function addConstellationCoverageZones(
  viewer: Cesium.Viewer,
  satellites: { id: string; satrec: satellite.SatRec; color?: Cesium.Color }[],
  colors: Cesium.Color[],
  timestamp = new Date()
): string[] {
  const createdEntityIds: string[] = [];
  
  satellites.forEach((sat, index) => {
    // Use satellite's individual color if available, otherwise fall back to colors array
    const color = sat.color ?? colors[index % colors.length];
    if (!color) {
      console.warn(`No color available for satellite ${sat.id}, skipping coverage zone`);
      return;
    }
    
    const entityId = addSatelliteCoverageZone(viewer, sat.id, sat.satrec, color, timestamp);
    
    if (entityId) {
      createdEntityIds.push(entityId);
    }
  });
  
  console.log(`Added ${createdEntityIds.length} coverage zones for constellation`);
  return createdEntityIds;
}

/**
 * Remove all coverage zones from viewer
 * @param viewer Cesium viewer instance
 */
export function removeAllCoverageZones(viewer: Cesium.Viewer): void {
  const entities = viewer.entities.values;
  const coverageEntities = entities.filter(entity => 
    entity.id?.toString().startsWith('coverage-')
  );
  
  coverageEntities.forEach(entity => {
    if (entity.id) {
      viewer.entities.removeById(entity.id.toString());
    }
  });
  
  console.log(`Removed ${coverageEntities.length} coverage zones`);
}

/**
 * Update coverage zones to current time
 * @param viewer Cesium viewer instance
 * @param satellites Array of satellite records
 * @param colors Array of colors
 */
export function updateCoverageZones(
  viewer: Cesium.Viewer,
  satellites: { id: string; satrec: satellite.SatRec }[],
  colors: Cesium.Color[]
): void {
  // Remove existing coverage zones
  removeAllCoverageZones(viewer);
  
  // Add updated coverage zones
  addConstellationCoverageZones(viewer, satellites, colors, new Date());
}

/**
 * Update the position of an existing coverage zone without recreating the entity
 * @param viewer Cesium viewer instance
 * @param satelliteId Satellite ID
 * @param satrec Satellite record
 * @param timestamp Current simulation time
 * @returns Success status
 */
export function updateSatelliteCoverageZonePosition(
  viewer: Cesium.Viewer,
  satelliteId: string,
  satrec: satellite.SatRec,
  timestamp: Date
): boolean {
  try {
    const coverageEntityId = `coverage-${satelliteId}`;
    const entity = viewer.entities.getById(coverageEntityId);
    
    if (!entity?.polygon) {
      return false;
    }
    
    // Get current satellite position
    const satPos = getSatellitePosition(satrec, timestamp);
    if (!satPos) {
      return false;
    }
    
    // Calculate new coverage radius and polygon
    const coverageRadius = calculateCoverageRadius(satPos.height, MIN_ELEVATION_DEG);
    const newPolygonPositions = createCoveragePolygon(
      { lat: satPos.lat, lng: satPos.lng },
      coverageRadius
    );
    
    // Update the existing polygon hierarchy instead of recreating entity
    entity.polygon.hierarchy = new Cesium.ConstantProperty(newPolygonPositions);
    
    return true;
  } catch (error) {
    console.error(`Error updating coverage zone position for ${satelliteId}:`, error);
    return false;
  }
}

/**
 * Update positions of all coverage zones efficiently without entity recreation
 * @param viewer Cesium viewer instance
 * @param satellites Array of satellite data
 * @param timestamp Current simulation time
 * @returns Number of successfully updated zones
 */
export function updateAllCoverageZonePositions(
  viewer: Cesium.Viewer,
  satellites: { id: string; satrec: satellite.SatRec }[],
  timestamp: Date
): number {
  let updatedCount = 0;
  
  satellites.forEach(sat => {
    if (updateSatelliteCoverageZonePosition(viewer, sat.id, sat.satrec, timestamp)) {
      updatedCount++;
    }
  });
  
  return updatedCount;
} 