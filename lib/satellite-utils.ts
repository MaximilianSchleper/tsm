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
export function generateDemoConstellationElements(): OrbitalElements[] {
  const baseEpoch = new Date(); // Current time
  const altitude = 550; // km
  const inclination = 65; // degrees - lower inclination spreads planes wider at equator
  const raans = [0, 90, 180, 270]; // Four orbital planes for global coverage
  
  // More randomized starting positions instead of just opposite sides
  const trueAnomalies = [45, 135, 225, 315]; // Spread around the orbit
  
  const elements: OrbitalElements[] = [];
  let satelliteNumber = 50001; // Starting satellite number for demo
  
  console.log(`[Demo Constellation] Generating ${elements.length} satellites: 4 planes × 2 satellites`);
  
  let anomalyIndex = 0;
  for (const raan of raans) {
    for (let i = 0; i < 2; i++) { // 2 satellites per plane
      const trueAnomaly = trueAnomalies[anomalyIndex % trueAnomalies.length];
      if (trueAnomaly === undefined) {
        console.error(`ERROR: No true anomaly defined for index ${anomalyIndex}`);
        continue;
      }
      
      elements.push({
        altitude,
        inclination,
        raan,
        trueAnomaly: trueAnomaly,
        epoch: baseEpoch,
        satelliteNumber: satelliteNumber++
      });
      anomalyIndex++;
    }
  }
  
  return elements;
}

/**
 * Generate optimal constellation orbital elements for maximum coverage
 */
export function generateOptimalConstellationElements(
  numSatellites: number,
  numPlanes: number, 
  altitudesPerPlane: number[]
): OrbitalElements[] {
  // Validation
  if (numSatellites < 1 || numSatellites > 60) {
    throw new Error(`Invalid numSatellites: ${numSatellites}. Must be between 1 and 60.`);
  }
  if (numPlanes < 1 || numPlanes > 10) {
    throw new Error(`Invalid numPlanes: ${numPlanes}. Must be between 1 and 10.`);
  }
  if (altitudesPerPlane.length !== numPlanes) {
    throw new Error(`altitudesPerPlane length (${altitudesPerPlane.length}) must equal numPlanes (${numPlanes})`);
  }
  for (let i = 0; i < altitudesPerPlane.length; i++) {
    const alt = altitudesPerPlane[i];
    if (alt === undefined || alt < 160 || alt > 2000) {
      throw new Error(`Invalid altitude at index ${i}: ${alt}km. Must be between 160 and 2000 km.`);
    }
  }
  if (numSatellites < numPlanes) {
    throw new Error(`numSatellites (${numSatellites}) must be >= numPlanes (${numPlanes})`);
  }

  // Calculate optimal RAAN distribution (evenly spaced around Earth)
  const raans: number[] = [];
  for (let i = 0; i < numPlanes; i++) {
    raans.push((i * 360) / numPlanes);
  }

  // Distribute satellites optimally across planes
  const satellitesPerPlane: number[] = [];
  const baseSatsPerPlane = Math.floor(numSatellites / numPlanes);
  const extraSats = numSatellites % numPlanes;
  
  for (let i = 0; i < numPlanes; i++) {
    // Distribute extra satellites to first planes for even distribution
    satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
  }

  const baseEpoch = new Date();
  const inclination = 65; // degrees - good for global coverage
  const elements: OrbitalElements[] = [];
  let satelliteNumber = 50001;

  console.log(`[Optimal Constellation] Generating ${numSatellites} satellites across ${numPlanes} planes`);
  console.log(`[Optimal Constellation] RAAN distribution:`, raans);
  console.log(`[Optimal Constellation] Satellites per plane:`, satellitesPerPlane);

  // Generate satellites for each plane
  for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
    const raan = raans[planeIndex]!;
    const altitude = altitudesPerPlane[planeIndex]!;
    const satsInThisPlane = satellitesPerPlane[planeIndex]!;

    // Calculate optimal true anomaly distribution within this plane
    const trueAnomalies: number[] = [];
    for (let satIndex = 0; satIndex < satsInThisPlane; satIndex++) {
      trueAnomalies.push((satIndex * 360) / satsInThisPlane);
    }

    // Create satellites for this plane
    for (let satIndex = 0; satIndex < satsInThisPlane; satIndex++) {
      const trueAnomaly = trueAnomalies[satIndex]!;
      
      elements.push({
        altitude,
        inclination,
        raan,
        trueAnomaly,
        epoch: baseEpoch,
        satelliteNumber: satelliteNumber++
      });
    }
  }

  return elements;
} 