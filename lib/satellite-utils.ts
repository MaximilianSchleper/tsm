/**
 * Satellite utilities for generating TLE data from orbital elements
 */

interface OrbitalElements {
  altitude: number;      // km above Earth surface
  inclination: number;   // degrees
  raan: number;          // Right Ascension of Ascending Node, degrees
  trueAnomaly: number;   // degrees
  epoch: Date;           // epoch date
  satelliteNumber: number; // unique satellite identifier
}

/**
 * Convert altitude to mean motion (revolutions per day)
 * Using Kepler's third law: T = 2π√(a³/μ) where μ = 398600.4418 km³/s²
 */
function altitudeToMeanMotion(altitude: number): number {
  const earthRadius = 6378.137; // km
  const mu = 398600.4418; // km³/s² - Earth's gravitational parameter
  
  const semiMajorAxis = earthRadius + altitude; // km
  const period = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / mu); // seconds
  const periodMinutes = period / 60; // minutes
  const meanMotion = 1440 / periodMinutes; // revolutions per day (1440 min/day)
  
  return meanMotion;
}

/**
 * Calculate epoch in TLE format (YYDDD.DDDDDDDD)
 */
function dateToTLEEpoch(date: Date): string {
  const year = date.getFullYear() % 100; // Last 2 digits of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const fractionOfDay = (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;
  
  const epochDay = dayOfYear + fractionOfDay;
  return `${year.toString().padStart(2, '0')}${epochDay.toFixed(8).padStart(12, '0')}`;
}

/**
 * Calculate checksum for TLE line
 */
function calculateTLEChecksum(line: string): number {
  let checksum = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const char = line[i];
    if (char && char >= '0' && char <= '9') {
      checksum += parseInt(char, 10);
    } else if (char === '-') {
      checksum += 1;
    }
  }
  return checksum % 10;
}

/**
 * Generate TLE lines from orbital elements
 */
export function generateTLE(elements: OrbitalElements): { line1: string; line2: string } {
  const { altitude, inclination, raan, trueAnomaly, epoch, satelliteNumber } = elements;
  
  const meanMotion = altitudeToMeanMotion(altitude);
  const epochStr = dateToTLEEpoch(epoch);
  
  // For demo purposes, using simplified values for some TLE fields
  const classification = 'U'; // Unclassified
  const intlDesignator = `25${satelliteNumber.toString().padStart(3, '0')}A`; // Synthetic designator
  const meanMotionDot = 0.00000000; // First derivative (set to 0 for circular orbits)
  const meanMotionDotDot = 0; // Second derivative (set to 0)
  const bstar = 0.00000000; // Ballistic coefficient (set to 0 for demo)
  const ephemerisType = 0;
  const elementSetNumber = 999;
  const eccentricity = 0.0000000; // Circular orbit
  const argOfPerigee = 0.0000; // Not meaningful for circular orbit
  const meanAnomaly = trueAnomaly; // For circular orbits, mean anomaly ≈ true anomaly
  const revNumber = 0; // Revolution number at epoch
  
  // Line 1: Satellite number, classification, intl designator, epoch, motion derivatives, bstar, ephemeris type, element set number
  let line1 = `1 ${satelliteNumber.toString().padStart(5, '0')}${classification} ${intlDesignator} ${epochStr}  ${meanMotionDot.toFixed(8)}  ${meanMotionDotDot.toString().padStart(8, '0')}  ${bstar.toFixed(7).replace('0.', '')}+0 ${ephemerisType} ${elementSetNumber.toString().padStart(4, '0')}`;
  
  // Line 2: Satellite number, inclination, RAAN, eccentricity, arg of perigee, mean anomaly, mean motion, rev number
  let line2 = `2 ${satelliteNumber.toString().padStart(5, '0')} ${inclination.toFixed(4).padStart(8, ' ')} ${raan.toFixed(4).padStart(8, ' ')} ${eccentricity.toFixed(7).substring(2)} ${argOfPerigee.toFixed(4).padStart(8, ' ')} ${meanAnomaly.toFixed(4).padStart(8, ' ')} ${meanMotion.toFixed(8)}${revNumber.toString().padStart(5, '0')}`;
  
  // Add checksums
  const checksum1 = calculateTLEChecksum(line1);
  const checksum2 = calculateTLEChecksum(line2);
  
  line1 += checksum1.toString();
  line2 += checksum2.toString();
  
  return { line1, line2 };
}

/**
 * Generate demo constellation orbital elements
 */
export const generateDemoConstellationElements = (): OrbitalElements[] => {
  const elements: OrbitalElements[] = [];
  const planes = 4;
  const satellitesPerPlane = 2;
  const altitude = 550; // 550km altitude
  const inclination = 65; // 65° inclination
  
  let satelliteNumber = 25000; // Starting satellite number
  
  for (let plane = 0; plane < planes; plane++) {
    const raan = (plane * 360) / planes; // 0°, 90°, 180°, 270°
    
    for (let sat = 0; sat < satellitesPerPlane; sat++) {
      const trueAnomaly = (sat * 360) / satellitesPerPlane; // 0°, 180°
      
      elements.push({
        altitude,
        inclination,
        raan,
        trueAnomaly,
        epoch: new Date(), // Current time as epoch
        satelliteNumber: satelliteNumber++
      });
    }
  }
  
  return elements;
};

/**
 * Generate optimal constellation orbital elements for maximum coverage
 */
export const generateOptimalConstellationElements = (
  numSatellites: number,
  numPlanes: number,
  altitudesPerPlane: number[]
): OrbitalElements[] => {
  if (altitudesPerPlane.length !== numPlanes) {
    throw new Error(`Number of altitudes (${altitudesPerPlane.length}) must equal number of planes (${numPlanes})`);
  }
  
  const elements: OrbitalElements[] = [];
  const inclination = 65; // degrees
  
  // Calculate RAAN values for evenly distributed planes
  const raans: number[] = [];
  for (let i = 0; i < numPlanes; i++) {
    raans.push((i * 360) / numPlanes);
  }
  
  // Calculate satellites per plane
  const baseSatsPerPlane = Math.floor(numSatellites / numPlanes);
  const extraSats = numSatellites % numPlanes;
  const satellitesPerPlane: number[] = [];
  
  for (let i = 0; i < numPlanes; i++) {
    satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
  }
  
  let satelliteNumber = 30000; // Starting satellite number for custom constellations
  
  // Generate satellites for each plane
  for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
    const raan = raans[planeIndex]!;
    const altitude = altitudesPerPlane[planeIndex]!;
    const satsInThisPlane = satellitesPerPlane[planeIndex]!;
    
    for (let satIndex = 0; satIndex < satsInThisPlane; satIndex++) {
      const trueAnomaly = (satIndex * 360) / satsInThisPlane;
      
      elements.push({
        altitude,
        inclination,
        raan,
        trueAnomaly,
        epoch: new Date(),
        satelliteNumber: satelliteNumber++
      });
    }
  }
  
  return elements;
}; 