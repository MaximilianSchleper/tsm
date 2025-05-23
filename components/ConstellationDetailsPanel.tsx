import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useCesium } from 'resium';
import * as satellite from 'satellite.js';
import * as Cesium from 'cesium'; // Re-enable Cesium
import { generateDemoConstellationElements, generateTLE } from '../lib/satellite-utils';
import { calculateInstantaneousCoverage } from '../lib/coverage-utils';
import { addConstellationCoverageZones, removeAllCoverageZones } from '../lib/coverage-visualization';

interface ConstellationInfo {
  type: 'none' | 'demo';
  satelliteCount: number;
  generatedAt: Date | null;
  config: {
    planes?: number;
    satellitesPerPlane?: number;
    altitude?: number;
    altitudesByPlane?: number[]; // [RAAN0°, RAAN90°, RAAN180°, RAAN270°]
    inclination?: number;
    simulationDays?: number;
  };
  coverage?: {
    globalPercentage: number;
    calculatedAt: Date;
  };
  satelliteRecords?: satellite.SatRec[]; // Store the satellite records for coverage calculation
  satelliteIds?: string[]; // Store satellite IDs for coverage visualization
}

const ConstellationDetailsPanel = () => {
  const { viewer } = useCesium();
  const [constellationInfo, setConstellationInfo] = useState<ConstellationInfo>({
    type: 'none',
    satelliteCount: 0,
    generatedAt: null,
    config: {}
  });
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [planeAltitudes, setPlaneAltitudes] = useState<number[]>([550, 550, 550, 550]); // Default all at 550km

  const {
    position,
    size,
    setPosition,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 1000 - 420 }, // Adjusted for bigger panel
    initialSize: { width: 400, height: 550 }, // Added 30px for button visibility when coverage shown
    minWidth: 400,
    minHeight: 550,
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

  // Monitor animation state
  useEffect(() => {
    if (!viewer?.clock) return;

    const checkAnimationState = () => {
      setIsAnimationPlaying(viewer.clock.shouldAnimate);
    };

    // Check initial state
    checkAnimationState();

    // Monitor clock changes
    viewer.clock.onTick.addEventListener(checkAnimationState);

    return () => {
      viewer.clock.onTick.removeEventListener(checkAnimationState);
    };
  }, [viewer]);

  // Live coverage zone updates
  useEffect(() => {
    // Hide coverage zones automatically when animation starts
    if (isAnimationPlaying && showCoverageZones && viewer) {
      removeAllCoverageZones(viewer);
      setShowCoverageZones(false);
    }
  }, [isAnimationPlaying, showCoverageZones, viewer]);

  const generateDemoConstellation = () => {
    if (!viewer) {
      console.error("Cesium viewer is not available");
      return;
    }

    try {
      // Clear all existing satellites
      viewer.entities.removeAll();

      // Generate base orbital elements for 8 satellites, but we'll modify altitudes per plane
      const baseElements = generateDemoConstellationElements();

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

      // Store satellite records for coverage calculation
      const satelliteRecords: satellite.SatRec[] = [];
      const satelliteIds: string[] = [];

      // Generate and add each satellite
      baseElements.forEach((satelliteElements, index) => {
        const planeIndex = Math.floor(index / 2); // 2 satellites per plane
        const satelliteInPlane = index % 2; // 0-1 within each plane
        const color = colors[planeIndex];
        if (!color) {
          console.error(`ERROR: No color defined for plane ${planeIndex}`);
          return;
        }
        const satName = `Demo-${planeIndex + 1}${satelliteInPlane === 0 ? 'A' : 'B'}`; // Demo-1A, Demo-1B, Demo-2A, Demo-2B, etc.
        const satelliteId = `demo-satellite-${satelliteElements.satelliteNumber}`;

        // Override altitude with the value from planeAltitudes
        const customAltitude = planeAltitudes[planeIndex] ?? 550;
        const customElements = {
          ...satelliteElements,
          altitude: customAltitude
        };

        // Generate TLE for this satellite with custom altitude
        const tle = generateTLE(customElements);

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
          id: satelliteId,
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

        // Store satellite record for coverage calculation
        satelliteRecords.push(satrec);
        satelliteIds.push(satelliteId);
      });

      // Update viewer clock for full week simulation
      viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 300; // 5-minute real-time = 1 day simulation

      // Update constellation info
      setConstellationInfo({
        type: 'demo',
        satelliteCount: baseElements.length,
        generatedAt: new Date(),
        config: {
          planes: 4,
          satellitesPerPlane: 2,
          altitude: planeAltitudes[0],
          altitudesByPlane: planeAltitudes,
          inclination: 65,
          simulationDays: durationDays
        },
        satelliteRecords: satelliteRecords,
        satelliteIds: satelliteIds
      });

    } catch (error) {
      console.error("ERROR during demo constellation generation:", error);
    }
  };

  const generateDefaultConstellation = () => {
    // Reset altitudes to default when generating fresh constellation
    setPlaneAltitudes([550, 550, 550, 550]);
    // Generate with default altitudes
    generateDemoConstellation();
  };

  const applyAltitudeChanges = () => {
    // Use current planeAltitudes values
    generateDemoConstellation();
  };

  const clearConstellation = () => {
    if (!viewer) return;
    viewer.entities.removeAll();
    setShowCoverageZones(false);
    setPlaneAltitudes([550, 550, 550, 550]); // Reset altitude sliders
    setConstellationInfo({
      type: 'none',
      satelliteCount: 0,
      generatedAt: null,
      config: {},
      satelliteRecords: []
    });
  };

  const toggleCoverage = () => {
    if (!viewer || !constellationInfo.satelliteRecords || !constellationInfo.satelliteIds) {
      return;
    }

    if (showCoverageZones) {
      // Hide coverage zones
      removeAllCoverageZones(viewer);
      setShowCoverageZones(false);
    } else {
      // Show coverage zones at current simulation time (only when paused)
      const currentTime = Cesium.JulianDate.toDate(viewer.clock.currentTime);
      
      const colors = [
        Cesium.Color.CYAN,      // Plane 1
        Cesium.Color.ORANGE,    // Plane 2
        Cesium.Color.LIME,      // Plane 3
        Cesium.Color.MAGENTA,   // Plane 4
      ];

      // Prepare satellite data for creation
      const satelliteData = constellationInfo.satelliteRecords
        .map((satrec, index) => {
          const id = constellationInfo.satelliteIds![index];
          if (!id) return null;
          
          // Use same color logic as satellite creation: planeIndex based
          const planeIndex = Math.floor(index / 2); // 2 satellites per plane
          const color = colors[planeIndex];
          if (!color) return null;
          
          return { id, satrec, color };
        })
        .filter((item): item is { id: string; satrec: satellite.SatRec; color: Cesium.Color } => item !== null);

      // Create color array in the right order for the satellites
      const orderedColors = satelliteData.map(sat => sat.color);

      // Create zones at current simulation time
      addConstellationCoverageZones(viewer, satelliteData, orderedColors, currentTime);
      
      // Calculate coverage percentage
      const coverageResult = calculateInstantaneousCoverage(constellationInfo.satelliteRecords, currentTime);
      
      // Update constellation info with coverage
      setConstellationInfo(prev => ({
        ...prev,
        coverage: {
          globalPercentage: coverageResult.globalPercentage,
          calculatedAt: coverageResult.calculatedAt
        }
      }));
      
      setShowCoverageZones(true);
    }
  };

  const handleAltitudeChange = (index: number, newValue: number) => {
    // Update slider values in UI only - no orbital changes until Apply is pressed
    setPlaneAltitudes(prev => {
      const newAltitudes = [...prev];
      newAltitudes[index] = newValue;
      return newAltitudes;
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
        {/* Status and Configuration in 2 columns */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {/* Constellation Status Section */}
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Status</h3>
            <div className="text-xs text-gray-400 space-y-1">
              <div>Type: <span className="text-white">
                {constellationInfo.type === 'none' ? 'None' : 
                 'Demo'}
              </span></div>
              <div>Satellites: <span className="text-white">{constellationInfo.satelliteCount}</span></div>
              {constellationInfo.generatedAt && (
                <div>Generated: <span className="text-white">
                  {constellationInfo.generatedAt.toLocaleTimeString()}
                </span></div>
              )}
              {constellationInfo.coverage && (
                <>
                  <div>Coverage: <span className="text-green-400 font-semibold">
                    {constellationInfo.coverage.globalPercentage}%
                  </span></div>
                  <div>Calculated: <span className="text-white">
                    {constellationInfo.coverage.calculatedAt.toLocaleTimeString()}
                  </span></div>
                </>
              )}
            </div>
          </div>

          {/* Configuration Details Section */}
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Config</h3>
            <div className="text-xs text-gray-400 space-y-1">
              {constellationInfo.type === 'none' ? (
                <div className="text-gray-500">No constellation loaded</div>
              ) : (
                <>
                  <div>Planes: <span className="text-white">{constellationInfo.config.planes}</span></div>
                  <div>Sats/Plane: <span className="text-white">{constellationInfo.config.satellitesPerPlane}</span></div>
                  <div>Inclination: <span className="text-white">{constellationInfo.config.inclination}°</span></div>
                  <div>Duration: <span className="text-white">{constellationInfo.config.simulationDays} days</span></div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Altitude Control Section */}
        {constellationInfo.type !== 'none' && (
          <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Orbital Plane Altitudes</h3>
            <div className="space-y-2">
              {planeAltitudes.map((altitude, index) => {
                const planeColors = ['cyan', 'orange', 'lime', 'magenta'];
                const raanValues = [0, 90, 180, 270];
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-semibold text-${planeColors[index]}-400`}>
                        RAAN {raanValues[index]}°
                      </span>
                      <span className="text-xs text-white">{altitude} km</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">160km</span>
                      <input
                        type="range"
                        min="160"
                        max="2000"
                        step="10"
                        value={altitude}
                        onChange={(e) => handleAltitudeChange(index, parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, ${planeColors[index]} 0%, ${planeColors[index]} ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 100%)`
                        }}
                      />
                      <span className="text-xs text-gray-500">2000km</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Button Grid 2x2 Layout */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {constellationInfo.type !== 'none' ? (
            <>
              <button
                onClick={applyAltitudeChanges}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold"
              >
                Apply Changes
              </button>
              
              <button
                onClick={generateDefaultConstellation}
                className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs"
              >
                Reset (550km)
              </button>
              
              <button
                onClick={clearConstellation}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
              >
                Clear All
              </button>
              
              <button
                onClick={toggleCoverage}
                disabled={!constellationInfo.satelliteRecords || isAnimationPlaying}
                className={`px-3 py-2 text-white rounded text-xs ${
                  !constellationInfo.satelliteRecords || isAnimationPlaying
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : showCoverageZones
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-purple-500 hover:bg-purple-600'
                }`}
                title={isAnimationPlaying ? "Coverage can only be shown when animation is paused" : ""}
              >
                {isAnimationPlaying 
                  ? 'Coverage (Pause)' 
                  : showCoverageZones 
                  ? 'Hide Coverage' 
                  : 'Show Coverage'
                }
              </button>
            </>
          ) : (
            <>
              <button
                onClick={generateDefaultConstellation}
                className="col-span-2 px-3 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-semibold"
              >
                Generate Demo Constellation
              </button>
              
              <button
                onClick={clearConstellation}
                disabled={true}
                className="bg-gray-600 cursor-not-allowed px-3 py-2 text-white rounded text-xs"
              >
                Clear All
              </button>
              
              <button
                onClick={toggleCoverage}
                disabled={true}
                className="bg-gray-600 cursor-not-allowed px-3 py-2 text-white rounded text-xs"
              >
                Show Coverage
              </button>
            </>
          )}
        </div>
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default ConstellationDetailsPanel; 