import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useCesium } from 'resium';
import * as satellite from 'satellite.js';
import * as Cesium from 'cesium'; // Re-enable Cesium
import { generateDemoConstellationElements, generateTLE } from '../lib/satellite-utils';

interface ConstellationInfo {
  type: 'none' | 'test' | 'demo';
  satelliteCount: number;
  generatedAt: Date | null;
  config: {
    planes?: number;
    satellitesPerPlane?: number;
    altitude?: number;
    inclination?: number;
    simulationDays?: number;
  };
}

const ConstellationDetailsPanel = () => {
  const { viewer } = useCesium();
  const [constellationInfo, setConstellationInfo] = useState<ConstellationInfo>({
    type: 'none',
    satelliteCount: 0,
    generatedAt: null,
    config: {}
  });

  const {
    position,
    size,
    setPosition,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 1000 - 380 }, // Adjusted for bigger panel
    initialSize: { width: 340, height: 520 }, // Increased height to fit all content
    minWidth: 340,
    minHeight: 520,
  });

  // Update position based on window dimensions on client side - Mount only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set initial position based on the initialSize from the hook, which is stable.
      // Using size.width from state here would reflect the current size after potential resizes if this ran more than once.
      // However, with an empty dependency array, it uses the size state as it is on the first client render.
      setPosition(prevPos => ({ ...prevPos, left: window.innerWidth - (size.width + 40) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only on mount

  const addTestSatellite = () => {
    if (!viewer) {
      console.error("Cesium viewer is not available");
      return;
    }

    // ISS TLE
    const tleLine1 = '1 25544U 98067A   25141.33820368  .00008211  00000+0  15360-3 0  9995';
    const tleLine2 = '2 25544  51.6382  80.0845 0002544 127.0828  16.1893 15.49641181510997';
    
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

    if (satrec.error !== satellite.SatRecError.None) {
      console.error("TLE Parsing Error. Code:", satrec.error);
      return;
    }

    const positionProperty = new Cesium.SampledPositionProperty();

    // Time range: May 21, 2025, 05:09 PM CEST to +24 hours
    const startTime = new Date('2025-05-21T17:09:00+02:00'); // CEST is UTC+2
    const durationHours = 24;
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    const timeStepSeconds = 60;
    // let samplesAdded = 0; // Commented out as it's unused

    // console.log(`Starting propagation loop from ${startTime.toISOString()} to ${endTime.toISOString()} with ${timeStepSeconds}s step.`);

    for (let currentTime = new Date(startTime.getTime()); currentTime <= endTime; currentTime.setTime(currentTime.getTime() + timeStepSeconds * 1000)) {
      const jsDate = new Date(currentTime);

      const positionAndVelocity = satellite.propagate(satrec, jsDate);
      
      if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
        continue;
      }

      const positionEciKm = positionAndVelocity.position;
      const positionEciMeters = new Cesium.Cartesian3(
        positionEciKm.x * 1000,
        positionEciKm.y * 1000,
        positionEciKm.z * 1000
      );

      const cesiumJulianDate = Cesium.JulianDate.fromDate(jsDate);
      const transform = Cesium.Transforms.computeIcrfToFixedMatrix(cesiumJulianDate);

      if (!transform) {
        continue;
      }

      const positionEcef = Cesium.Matrix3.multiplyByVector(
        transform,
        positionEciMeters,
        new Cesium.Cartesian3()
      );

      positionProperty.addSample(cesiumJulianDate, positionEcef);
      // samplesAdded++;
    }

    // Remove existing entity if it exists
    if (viewer.entities.getById('test-satellite-iss')) {
      viewer.entities.removeById('test-satellite-iss');
      // console.log("Removed existing test satellite entity.");
    }

    // Add the new satellite entity
    // The return value of viewer.entities.add (the entity itself) is not stored 
    // in satelliteEntity anymore as satelliteEntity was unused.
    viewer.entities.add({
      id: 'test-satellite-iss',
      name: 'Test Satellite (ISS)',
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromDate(startTime),
        stop: Cesium.JulianDate.fromDate(endTime),
      })]),
      position: positionProperty,
      billboard: {
        image: '/satellite-dish.png',
        width: 40,
        height: 40,
      },
      path: {
        show: true,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.YELLOW,
          dashLength: 16.0,
        }),
        width: 2,
        leadTime: 3600, // 1 hour in seconds
        trailTime: 3600, // 1 hour in seconds
        resolution: 10, // Sample points for path, lower is smoother but more performant
      },
    });

    viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
    viewer.clock.multiplier = 60;

    // Update constellation info
    setConstellationInfo({
      type: 'test',
      satelliteCount: 1,
      generatedAt: new Date(),
      config: {
        simulationDays: 1 // 24 hours = 1 day
      }
    });

  };

  const generateDemoConstellation = () => {
    if (!viewer) {
      console.error("Cesium viewer is not available");
      return;
    }

    console.log("Generating demo constellation...");

    try {
      // Clear all existing satellites
      viewer.entities.removeAll();

      // Generate orbital elements for 8 satellites
      const elements = generateDemoConstellationElements();

      // Color scheme: Different colors for each orbital plane
      const colors = [
        Cesium.Color.CYAN,      // Plane 1 (RAAN 0°)
        Cesium.Color.ORANGE,    // Plane 2 (RAAN 90°)
        Cesium.Color.LIME,      // Plane 3 (RAAN 180°)
        Cesium.Color.MAGENTA,   // Plane 4 (RAAN 270°)
      ];

      // Time setup: Full week simulation
      const startTime = new Date(); // Current time
      const durationDays = 7; // Full week
      const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      const timeStepSeconds = 120; // 2-minute steps for better performance

      // Generate and add each satellite
      elements.forEach((satelliteElements, index) => {
        const planeIndex = Math.floor(index / 2); // 2 satellites per plane
        const satelliteInPlane = index % 2; // 0-1 within each plane
        const color = colors[planeIndex];
        if (!color) {
          console.error(`ERROR: No color defined for plane ${planeIndex}`);
          return;
        }
        const satName = `Demo-${planeIndex + 1}${satelliteInPlane === 0 ? 'A' : 'B'}`; // Demo-1A, Demo-1B, Demo-2A, Demo-2B, etc.

        // Generate TLE for this satellite
        const tle = generateTLE(satelliteElements);

        // Parse TLE with satellite.js
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        if (satrec.error !== satellite.SatRecError.None) {
          console.error(`ERROR: TLE parsing failed for ${satName}:`, satrec.error);
          return; // Skip this satellite
        }

        // Create position property by propagating the orbit
        const positionProperty = new Cesium.SampledPositionProperty();

        for (let currentTime = new Date(startTime.getTime()); currentTime <= endTime; currentTime.setTime(currentTime.getTime() + timeStepSeconds * 1000)) {
          const jsDate = new Date(currentTime);
          const positionAndVelocity = satellite.propagate(satrec, jsDate);

          if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
            continue;
          }

          const positionEciKm = positionAndVelocity.position;
          const positionEciMeters = new Cesium.Cartesian3(
            positionEciKm.x * 1000,
            positionEciKm.y * 1000,
            positionEciKm.z * 1000
          );

          const cesiumJulianDate = Cesium.JulianDate.fromDate(jsDate);
          const transform = Cesium.Transforms.computeIcrfToFixedMatrix(cesiumJulianDate);

          if (!transform) {
            continue;
          }

          const positionEcef = Cesium.Matrix3.multiplyByVector(
            transform,
            positionEciMeters,
            new Cesium.Cartesian3()
          );

          positionProperty.addSample(cesiumJulianDate, positionEcef);
        }

        // Add satellite entity to Cesium
        viewer.entities.add({
          id: `demo-satellite-${satelliteElements.satelliteNumber}`,
          name: satName,
          availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
            start: Cesium.JulianDate.fromDate(startTime),
            stop: Cesium.JulianDate.fromDate(endTime),
          })]),
          position: positionProperty,
          billboard: {
            image: '/satellite-dish.png',
            width: 30,
            height: 30,
            color: color,
          },
          path: {
            show: true,
            material: new Cesium.PolylineDashMaterialProperty({
              color: color.withAlpha(0.6),
              dashLength: 8.0,
            }),
            width: 2,
            leadTime: 3600 * 1, // 1 hour ahead
            trailTime: 3600 * 1, // 1 hour behind
            resolution: 30,
          },
        });
      });

      // Update viewer clock for full week simulation
      viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 300; // 5-minute real-time = 1 day simulation

      console.log(`✅ Demo constellation complete: ${elements.length} satellites over ${durationDays} days`);

      // Update constellation info
      setConstellationInfo({
        type: 'demo',
        satelliteCount: elements.length,
        generatedAt: new Date(),
        config: {
          planes: 4,
          satellitesPerPlane: 2,
          altitude: 550,
          inclination: 65,
          simulationDays: durationDays
        }
      });

    } catch (error) {
      console.error("ERROR during demo constellation generation:", error);
    }
  };

  const clearConstellation = () => {
    if (!viewer) return;
    viewer.entities.removeAll();
    setConstellationInfo({
      type: 'none',
      satelliteCount: 0,
      generatedAt: null,
      config: {}
    });
  };

  return (
    <div
      className="draggable-window panel constellation-details-panel"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="window-header" onMouseDown={handleMouseDownDrag}>
        Constellation Details
      </div>
      <div className="window-content">
        {/* Constellation Status Section */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Constellation Status</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <div>Type: <span className="text-white">
              {constellationInfo.type === 'none' ? 'None' : 
               constellationInfo.type === 'test' ? 'Test Satellite' : 
               'Demo Constellation'}
            </span></div>
            <div>Satellites: <span className="text-white">{constellationInfo.satelliteCount}</span></div>
            {constellationInfo.generatedAt && (
              <div>Generated: <span className="text-white">
                {constellationInfo.generatedAt.toLocaleTimeString()}
              </span></div>
            )}
          </div>
        </div>

        {/* Configuration Details Section */}
        <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Configuration Details</h3>
          <div className="text-xs text-gray-400 space-y-1">
            {constellationInfo.type === 'none' ? (
              <div className="text-gray-500">No constellation loaded</div>
            ) : constellationInfo.type === 'test' ? (
              <>
                <div>Satellite: <span className="text-white">ISS (Test)</span></div>
                <div>Duration: <span className="text-white">24 hours</span></div>
              </>
            ) : (
              <>
                <div>Planes: <span className="text-white">{constellationInfo.config.planes}</span></div>
                <div>Sats/Plane: <span className="text-white">{constellationInfo.config.satellitesPerPlane}</span></div>
                <div>Altitude: <span className="text-white">{constellationInfo.config.altitude} km</span></div>
                <div>Inclination: <span className="text-white">{constellationInfo.config.inclination}°</span></div>
                <div>Duration: <span className="text-white">{constellationInfo.config.simulationDays} days</span></div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={addTestSatellite}
          className="mt-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded w-full text-sm"
        >
          Add Test Satellite
        </button>
        <button
          onClick={generateDemoConstellation}
          className="mt-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded w-full text-sm"
        >
          Generate Demo Constellation
        </button>
        <button
          onClick={clearConstellation}
          className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded w-full text-sm"
        >
          Clear All
        </button>
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default ConstellationDetailsPanel; 