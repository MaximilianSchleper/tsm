import React, { useEffect } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useCesium } from 'resium';
import * as satellite from 'satellite.js';
import * as Cesium from 'cesium'; // Re-enable Cesium

const ConstellationDetailsPanel = () => {
  const { viewer } = useCesium();
  const {
    position,
    size,
    setPosition,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 1000 - 320 }, // Default for SSR
    initialSize: { width: 280, height: 270 },
    minWidth: 250,
    minHeight: 180,
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
    console.log("--- Adding Test Satellite ---");

    // ISS TLE
    const tleLine1 = '1 25544U 98067A   25141.33820368  .00008211  00000+0  15360-3 0  9995';
    const tleLine2 = '2 25544  51.6382  80.0845 0002544 127.0828  16.1893 15.49641181510997';
    
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    console.log("Satellite Record (satrec):", satrec);

    if (satrec.error !== satellite.SatRecError.None) {
      console.error("TLE Parsing Error. Code:", satrec.error);
      return;
    }
    console.log("TLE Parsed Successfully.");

    const positionProperty = new Cesium.SampledPositionProperty();
    console.log("SampledPositionProperty created.");

    // Time range: May 21, 2025, 05:09 PM CEST to +24 hours
    const startTime = new Date('2025-05-21T17:09:00+02:00'); // CEST is UTC+2
    const durationHours = 24;
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    const timeStepSeconds = 60;
    let samplesAdded = 0;

    console.log(`Starting propagation loop from ${startTime.toISOString()} to ${endTime.toISOString()} with ${timeStepSeconds}s step.`);

    for (let currentTime = new Date(startTime.getTime()); currentTime <= endTime; currentTime.setTime(currentTime.getTime() + timeStepSeconds * 1000)) {
      const jsDate = new Date(currentTime);

      // Use satellite.propagate with a JavaScript Date object
      const positionAndVelocity = satellite.propagate(satrec, jsDate);
      
      if (!positionAndVelocity || typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
        console.warn(`Propagation failed or returned invalid position for date: ${jsDate.toISOString()}`);
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
        console.warn(`Failed to compute IcrfToFixedMatrix for date: ${jsDate.toISOString()}`);
        continue;
      }

      const positionEcef = Cesium.Matrix3.multiplyByVector(
        transform,
        positionEciMeters,
        new Cesium.Cartesian3()
      );

      positionProperty.addSample(cesiumJulianDate, positionEcef);
      samplesAdded++;
      if (samplesAdded <= 5) { // Log first few successful samples
        console.log(`Sample ${samplesAdded} added: Time: ${jsDate.toISOString()}, ECI: {x: ${positionEciKm.x.toFixed(3)}, y: ${positionEciKm.y.toFixed(3)}, z: ${positionEciKm.z.toFixed(3)}}, ECEF: {x: ${positionEcef.x.toFixed(0)}, y: ${positionEcef.y.toFixed(0)}, z: ${positionEcef.z.toFixed(0)}}`);
      }
    }
    console.log(`Total samples added to SampledPositionProperty: ${samplesAdded}`);
    console.log("SampledPositionProperty after adding samples:", positionProperty);

    // --- Create Cesium Entity ---
    if (viewer.entities.getById('test-satellite-iss')) {
      viewer.entities.removeById('test-satellite-iss');
      console.log("Removed existing test satellite entity.");
    }

    const satelliteEntity = viewer.entities.add({
      id: 'test-satellite-iss',
      name: 'Test Satellite (ISS)',
      availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
        start: Cesium.JulianDate.fromDate(startTime),
        stop: Cesium.JulianDate.fromDate(endTime),
      })]),
      position: positionProperty,
      point: {
        pixelSize: 5,
        color: Cesium.Color.RED,
      },
      path: {
        show: true,
        material: Cesium.Color.YELLOW,
        width: 2,
        leadTime: 3600, // 1 hour in seconds
        trailTime: 3600, // 1 hour in seconds
        resolution: 10, // Sample points for path, lower is smoother but more performant
      },
    });

    console.log("Satellite entity added to viewer:", satelliteEntity);

    // Optional: Set clock to match sample data times and start animation
    viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
    viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; // Loop when animation reaches the end
    viewer.clock.multiplier = 60; // Speed up animation (e.g., 60x real-time)
    // viewer.timeline.zoomTo(Cesium.JulianDate.fromDate(startTime), Cesium.JulianDate.fromDate(endTime)); // Ensure timeline shows full range

    // viewer.trackedEntity = satelliteEntity; // Remove or comment out to prevent auto-tracking
    console.log("Satellite entity added. Viewer will not auto-track it.");

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
        <div className="placeholder-box">
          Constellation Configuration Inputs Placeholder
        </div>
        <div className="placeholder-box">
          Generate Demo Constellation Button Placeholder
        </div>
        <button
          onClick={addTestSatellite}
          className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded w-full"
        >
          Add Test Satellite
        </button>
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default ConstellationDetailsPanel; 