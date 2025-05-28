import * as satellite from 'satellite.js';

// Import coverage radius calculation
import { calculateCoverageRadius } from './coverage-visualization';

// Earth and coverage constants
export const EARTH_RADIUS_KM = 6378.137; // WGS84 Earth radius in km
export const MIN_ELEVATION_DEG = 35; // Industry standard minimum elevation angle
export const GRID_RESOLUTION_DEG = 2; // Reduced to 2-degree grid for better accuracy

// Type definitions for coverage calculations
export interface EarthGridPoint {
  lat: number; // degrees
  lng: number; // degrees
}

export interface SatellitePosition {
  lat: number; // degrees
  lng: number; // degrees
  height: number; // km above Earth surface
}

export interface CoverageResult {
  globalPercentage: number;
  coveredPoints: number;
  totalPoints: number;
  calculatedAt: Date;
}

/**
 * Generate a grid of points covering Earth's surface
 * @param resolution Grid resolution in degrees (default: 5)
 * @returns Array of lat/lng grid points
 */
export function generateEarthGrid(resolution: number = GRID_RESOLUTION_DEG): EarthGridPoint[] {
  const points: EarthGridPoint[] = [];
  
  // Generate grid points from -180 to +180 longitude, -90 to +90 latitude
  for (let lng = -180; lng < 180; lng += resolution) {
    for (let lat = -90; lat <= 90; lat += resolution) {
      points.push({ lat, lng });
    }
  }
  
  return points;
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function radiansToDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the great circle distance between two points on Earth
 * @param lat1 Latitude of point 1 (degrees)
 * @param lng1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lng2 Longitude of point 2 (degrees)
 * @returns Distance in kilometers
 */
function calculateGreatCircleDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = EARTH_RADIUS_KM;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate elevation angle from ground point to satellite
 * @param satPos Satellite position (lat, lng, height)
 * @param groundPoint Ground point (lat, lng)
 * @returns Elevation angle in degrees
 */
export function calculateElevationAngle(satPos: SatellitePosition, groundPoint: EarthGridPoint): number {
  // Calculate angular distance from satellite ground track to ground point
  const angularDistance = calculateGreatCircleDistance(
    groundPoint.lat, groundPoint.lng, 
    satPos.lat, satPos.lng
  ) / EARTH_RADIUS_KM; // Convert to radians
  
  // Calculate maximum angular distance for satellite visibility
  const satAltitude = satPos.height;
  const earthRadius = EARTH_RADIUS_KM;
  
  // Simple elevation angle calculation using law of cosines
  // This is the standard approach for satellite coverage
  const cosElevation = Math.sin(angularDistance) / Math.sqrt(
    1 + 2 * (satAltitude / earthRadius) + (satAltitude / earthRadius) ** 2 - 
    2 * (1 + satAltitude / earthRadius) * Math.cos(angularDistance)
  );
  
  const elevationRad = Math.asin(cosElevation) - angularDistance;
  return radiansToDegrees(elevationRad);
}

/**
 * Get satellite position from TLE at specific time
 * @param satrec Satellite record from satellite.js
 * @param timestamp Time to calculate position
 * @returns Satellite position or null if calculation failed
 */
export function getSatellitePosition(satrec: satellite.SatRec, timestamp: Date): SatellitePosition | null {
  try {
    // Propagate satellite to the given time
    const positionAndVelocity = satellite.propagate(satrec, timestamp);
    
    if (!positionAndVelocity?.position) {
      return null;
    }
    
    // Convert ECI position to geodetic coordinates
    const gmst = satellite.gstime(timestamp);
    const geodeticCoords = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
    
    return {
      lat: radiansToDegrees(geodeticCoords.latitude),
      lng: radiansToDegrees(geodeticCoords.longitude),
      height: geodeticCoords.height // Already in km
    };
  } catch (error) {
    console.error('Error calculating satellite position:', error);
    return null;
  }
}

/**
 * Check if a ground point is covered by a satellite
 * @param satPos Satellite position
 * @param groundPoint Ground point to check
 * @param minElevation Minimum elevation angle in degrees
 * @returns True if point is covered
 */
export function isPointCovered(
  satPos: SatellitePosition, 
  groundPoint: EarthGridPoint, 
  minElevation: number = MIN_ELEVATION_DEG
): boolean {
  // Calculate distance from satellite ground track to ground point
  const groundDistance = calculateGreatCircleDistance(
    groundPoint.lat, groundPoint.lng, 
    satPos.lat, satPos.lng
  );
  
  // Calculate maximum coverage radius for given elevation angle
  // This is a simpler, more reliable approach
  const maxCoverageRadius = calculateCoverageRadius(satPos.height, minElevation);
  
  const isCovered = groundDistance <= maxCoverageRadius;
  
  // Debug: log first few checks
  // if (Math.random() < 0.001) { // 0.1% chance to avoid spam
  //   console.log(`🔍 Point (${groundPoint.lat.toFixed(1)}, ${groundPoint.lng.toFixed(1)}) -> Satellite (${satPos.lat.toFixed(1)}, ${satPos.lng.toFixed(1)}): distance=${groundDistance.toFixed(1)}km, maxRadius=${maxCoverageRadius.toFixed(1)}km, covered=${isCovered}`);
  // }
  
  return isCovered;
}

/**
 * Calculate instantaneous global coverage percentage for a constellation
 * @param satellites Array of satellite records
 * @param timestamp Time to calculate coverage
 * @param gridResolution Grid resolution in degrees
 * @param minElevation Minimum elevation angle in degrees
 * @returns Coverage result with percentage and details
 */
export function calculateInstantaneousCoverage(
  satellites: satellite.SatRec[],
  timestamp: Date,
  gridResolution: number = GRID_RESOLUTION_DEG,
  minElevation: number = MIN_ELEVATION_DEG
): CoverageResult {
  // console.log(`🛰️ Calculating coverage for ${satellites.length} satellites at ${timestamp.toISOString()}`);
  
  // Generate Earth grid
  const gridPoints = generateEarthGrid(gridResolution);
  let coveredPoints = 0;
  
  // Get all satellite positions at this time
  const satellitePositions: SatellitePosition[] = [];
  for (const sat of satellites) {
    const pos = getSatellitePosition(sat, timestamp);
    if (pos) {
      satellitePositions.push(pos);
      // console.log(`📍 Satellite at lat=${pos.lat.toFixed(1)}°, lng=${pos.lng.toFixed(1)}°, alt=${pos.height.toFixed(0)}km`);
    }
  }
  
  // console.log(`📍 Got positions for ${satellitePositions.length} satellites`);
  
  // Calculate coverage radius for debugging
  // if (satellitePositions.length > 0) {
  //   const sampleRadius = calculateCoverageRadius(satellitePositions[0]!.height, minElevation);
  //   console.log(`📏 Coverage radius at ${satellitePositions[0]!.height.toFixed(0)}km altitude: ${sampleRadius.toFixed(1)}km`);
    
  //   // Calculate theoretical max coverage
  //   const earthSurfaceArea = 4 * Math.PI * EARTH_RADIUS_KM * EARTH_RADIUS_KM;
  //   const singleSatCoverageArea = Math.PI * sampleRadius * sampleRadius;
  //   const theoreticalMaxCoverage = (singleSatCoverageArea * satellites.length / earthSurfaceArea) * 100;
  //   console.log(`🧮 Theoretical max coverage (no overlap): ${theoreticalMaxCoverage.toFixed(1)}%`);
  // }
  
  // Check coverage for each grid point
  gridPoints.forEach(point => {
    const isCovered = satellitePositions.some(satPos => 
      isPointCovered(satPos, point, minElevation)
    );
    
    if (isCovered) {
      coveredPoints++;
    }
  });
  
  const percentage = (coveredPoints / gridPoints.length) * 100;
  
  const result: CoverageResult = {
    globalPercentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
    coveredPoints,
    totalPoints: gridPoints.length,
    calculatedAt: timestamp
  };
  
  // console.log(`📊 Coverage result: ${result.globalPercentage}% (${coveredPoints}/${gridPoints.length} points)`);
  // console.log(`🎯 Grid resolution: ${gridResolution}° (${Math.sqrt(gridPoints.length).toFixed(0)}x${Math.sqrt(gridPoints.length).toFixed(0)} points)`);
  
  return result;
}