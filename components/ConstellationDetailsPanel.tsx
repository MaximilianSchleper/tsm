import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useCesium } from 'resium';
import * as satellite from 'satellite.js';
import * as Cesium from 'cesium'; // Re-enable Cesium
import { generateDemoConstellationElements, generateOptimalConstellationElements, generateTLE } from '../lib/satellite-utils';
import { calculateInstantaneousCoverage } from '../lib/coverage-utils';
import { addConstellationCoverageZones, removeAllCoverageZones } from '../lib/coverage-visualization';

interface ConstellationInfo {
  type: 'none' | 'demo' | 'custom';
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
  
  // Constellation parameters
  const [customSatellites, setCustomSatellites] = useState(12);
  const [customPlanes, setCustomPlanes] = useState(3);
  const [customAltitudes, setCustomAltitudes] = useState<number[]>([400, 500, 600]);
  const [lastApiTimestamp, setLastApiTimestamp] = useState<number>(0);
  const [shouldAutoGenerate, setShouldAutoGenerate] = useState(false);

  const {
    position,
    size,
    setPosition,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 1000 - 480 }, // Adjusted for bigger panel
    initialSize: { width: 460, height: 700 }, // Increased size for more planes
    minWidth: 460,
    minHeight: 600,
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

  // Poll for new API constellation parameters
  useEffect(() => {
    const pollForApiUpdates = async () => {
      try {
        const response = await fetch('/api/constellation');
        if (response.ok) {
          const result = await response.json() as { 
            success: boolean; 
            data?: { params: { numSatellites: number; numPlanes: number; altitudesPerPlane: number[] }; timestamp: number } 
          };
          if (result.success && result.data && result.data.timestamp > lastApiTimestamp) {
            const { params, timestamp } = result.data;
            
            console.log('[Frontend] New API constellation detected:', params);
            
            // Update UI parameters
            setCustomSatellites(params.numSatellites);
            setCustomPlanes(params.numPlanes);
            setCustomAltitudes(params.altitudesPerPlane);
            setLastApiTimestamp(timestamp);
            
            // Set flag to auto-generate
            setShouldAutoGenerate(true);
          }
        }
      } catch (error) {
        console.error('[Frontend] Error polling for API updates:', error);
      }
    };

    // Poll every 5 seconds for better performance
    const interval = setInterval(() => {
      void pollForApiUpdates();
    }, 5000);
    
    // Check immediately on mount
    void pollForApiUpdates();

    return () => clearInterval(interval);
  }, [lastApiTimestamp]);

  

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

      // Time setup with dynamic resolution based on satellite count
      const startTime = new Date(); // Current time
      const durationDays = 3; // 3 days for better performance with large constellations
      const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      
      // Dynamic time resolution based on satellite count for optimal UX
      const satelliteCount = baseElements.length;
      const timeStepSeconds = satelliteCount <= 8 ? 60 :    // 1-8 sats: 1-min (smooth orbits)
                             satelliteCount <= 16 ? 120 :   // 9-16 sats: 2-min (good detail)
                             satelliteCount <= 32 ? 240 :   // 17-32 sats: 4-min (balanced)
                             300;                            // 33+ sats: 5-min (performance)

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

        // Use default altitude for demo constellation
        const customAltitude = 550;
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
            leadTime: 3600 * 0.5, // 30 minutes ahead for better performance
            trailTime: 3600 * 0.5, // 30 minutes behind for better performance  
            resolution: satelliteCount <= 8 ? 15 :    // 1-8 sats: Very smooth orbits
                       satelliteCount <= 16 ? 30 :   // 9-16 sats: Smooth orbits
                       satelliteCount <= 32 ? 45 :   // 17-32 sats: Good orbits
                       60,                           // 33+ sats: Performance orbits
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
          altitude: 550,
          altitudesByPlane: [550, 550, 550, 550],
          inclination: 65,
          simulationDays: 3
        },
        satelliteRecords: satelliteRecords,
        satelliteIds: satelliteIds
      });

    } catch (error) {
      console.error("ERROR during demo constellation generation:", error);
    }
  };

  const generateDefaultConstellation = () => {
    // Reset to demo constellation defaults
    setCustomSatellites(8);
    setCustomPlanes(4);
    setCustomAltitudes([550, 550, 550, 550]);
    generateDemoConstellation();
  };

  const generateCustomConstellation = React.useCallback(() => {
    if (!viewer) {
      console.error("Cesium viewer is not available");
      return;
    }

    try {
      // Validation
      if (customAltitudes.length !== customPlanes) {
        alert(`Number of altitudes (${customAltitudes.length}) must equal number of planes (${customPlanes})`);
        return;
      }

      // Clear all existing satellites
      viewer.entities.removeAll();

      // Generate optimal constellation elements
      const elements = generateOptimalConstellationElements(
        customSatellites,
        customPlanes,
        customAltitudes
      );

      // Dynamic color generation for any number of planes
      const generateColors = (numPlanes: number): Cesium.Color[] => {
        const colors: Cesium.Color[] = [];
        for (let i = 0; i < numPlanes; i++) {
          const hue = (i * 360) / numPlanes; // Evenly distribute hues
          colors.push(Cesium.Color.fromHsl(hue / 360, 0.8, 0.6));
        }
        return colors;
      };

      const colors = generateColors(customPlanes);

      // Time setup with dynamic resolution based on satellite count
      const startTime = new Date();
      const durationDays = 3; // 3 days for better performance with large constellations
      const endTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      
      // Dynamic time resolution based on satellite count for optimal UX
      const timeStepSeconds = customSatellites <= 8 ? 60 :    // 1-8 sats: 1-min (smooth orbits)
                             customSatellites <= 16 ? 120 :   // 9-16 sats: 2-min (good detail)
                             customSatellites <= 32 ? 240 :   // 17-32 sats: 4-min (balanced)
                             300;                              // 33+ sats: 5-min (performance)

      // Store satellite records for coverage calculation
      const satelliteRecords: satellite.SatRec[] = [];
      const satelliteIds: string[] = [];

      // Calculate satellites per plane for naming
      const satellitesPerPlane: number[] = [];
      const baseSatsPerPlane = Math.floor(customSatellites / customPlanes);
      const extraSats = customSatellites % customPlanes;
      
      for (let i = 0; i < customPlanes; i++) {
        satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
      }

      // Generate and add each satellite
      let currentPlane = 0;
      let satInPlane = 0;
      
      elements.forEach((satelliteElements, index) => {
        // Determine which plane this satellite belongs to
        while (satInPlane >= (satellitesPerPlane[currentPlane] ?? 0)) {
          currentPlane++;
          satInPlane = 0;
        }
        
                  const color = colors[currentPlane];
          if (!color) {
            console.error(`ERROR: No color defined for plane ${currentPlane}`);
            return;
          }
        
        const satName = `Custom-${currentPlane + 1}${String.fromCharCode(65 + satInPlane)}`; // Custom-1A, Custom-1B, etc.
        const satelliteId = `custom-satellite-${satelliteElements.satelliteNumber}`;

        // Generate TLE for this satellite
        const tle = generateTLE(satelliteElements);

        // Parse TLE with satellite.js
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        if (satrec.error !== satellite.SatRecError.None) {
          console.error(`ERROR: TLE parsing failed for ${satName}:`, satrec.error);
          return;
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
            leadTime: 3600 * 0.5, // 30 minutes ahead for better performance
            trailTime: 3600 * 0.5, // 30 minutes behind for better performance
            resolution: customSatellites <= 8 ? 15 :    // 1-8 sats: Very smooth orbits
                       customSatellites <= 16 ? 30 :   // 9-16 sats: Smooth orbits
                       customSatellites <= 32 ? 45 :   // 17-32 sats: Good orbits
                       60,                             // 33+ sats: Performance orbits
          },
        });

        // Store satellite record for coverage calculation
        satelliteRecords.push(satrec);
        satelliteIds.push(satelliteId);
        
        satInPlane++;
      });

      // Update viewer clock
      viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.stopTime = Cesium.JulianDate.fromDate(endTime);
      viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = 300;

      // Update constellation info
      setConstellationInfo({
        type: 'custom',
        satelliteCount: elements.length,
        generatedAt: new Date(),
        config: {
          planes: customPlanes,
          satellitesPerPlane: Math.round(customSatellites / customPlanes),
          altitudesByPlane: customAltitudes,
          inclination: 65,
          simulationDays: 3
        },
        satelliteRecords: satelliteRecords,
        satelliteIds: satelliteIds
      });

    } catch (error) {
      console.error("ERROR during custom constellation generation:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      }
    }
  }, [viewer, customSatellites, customPlanes, customAltitudes]);

  // Auto-trigger constellation generation when API flag is set
  useEffect(() => {
    if (shouldAutoGenerate) {
      console.log('[Frontend] Auto-triggering custom constellation generation');
      setShouldAutoGenerate(false); // Reset flag
      generateCustomConstellation();
    }
  }, [shouldAutoGenerate, generateCustomConstellation]);

  const clearConstellation = () => {
    if (!viewer) return;
    viewer.entities.removeAll();
    setShowCoverageZones(false);
    
    // Reset constellation parameters
    setCustomSatellites(12);
    setCustomPlanes(3);
    setCustomAltitudes([400, 500, 600]);
    
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
      
      // Generate colors and satellite-to-plane mapping based on constellation type
      let colors: Cesium.Color[] = [];
      let satellitesPerPlane: number[] = [];
      
      if (constellationInfo.type === 'demo') {
        // Demo constellation: 4 planes, 2 satellites per plane
        colors = [
          Cesium.Color.CYAN,
          Cesium.Color.ORANGE,
          Cesium.Color.LIME,
          Cesium.Color.MAGENTA
        ];
        satellitesPerPlane = [2, 2, 2, 2];
      } else {
        // Custom constellation: use current parameters
        const numPlanes = customPlanes;
        const numSatellites = customSatellites;
        
        // Generate dynamic colors (same logic as generateCustomConstellation)
        colors = [];
        for (let i = 0; i < numPlanes; i++) {
          const hue = (i * 360) / numPlanes;
          colors.push(Cesium.Color.fromHsl(hue / 360, 0.8, 0.6));
        }
        
        // Calculate satellites per plane (same logic as generateCustomConstellation)
        const baseSatsPerPlane = Math.floor(numSatellites / numPlanes);
        const extraSats = numSatellites % numPlanes;
        
        satellitesPerPlane = [];
        for (let i = 0; i < numPlanes; i++) {
          satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
        }
      }

      // Map satellites to planes using the same logic as constellation generation
      const satelliteData = constellationInfo.satelliteRecords
        .map((satrec, index) => {
          const id = constellationInfo.satelliteIds![index];
          if (!id) return null;
          
          // Determine which plane this satellite belongs to
          let currentPlane = 0;
          let satellitesSoFar = 0;
          
          for (let plane = 0; plane < satellitesPerPlane.length; plane++) {
            const satsInThisPlane = satellitesPerPlane[plane] ?? 0;
            if (index < satellitesSoFar + satsInThisPlane) {
              currentPlane = plane;
              break;
            }
            satellitesSoFar += satsInThisPlane;
          }
          
          const color = colors[currentPlane];
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

  const applyCurrentConstellation = () => {
    // Regenerate constellation with current parameters
    if (constellationInfo.type === 'demo') {
      generateDemoConstellation();
    } else {
      generateCustomConstellation();
    }
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
        <div className="flex justify-between items-center w-full">
          <span>Constellation Details</span>
          {constellationInfo.coverage && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-300">Coverage:</span>
              <span className="text-green-400 font-bold text-lg bg-green-400/10 px-2 py-1 rounded border border-green-400/30">
                {constellationInfo.coverage.globalPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="window-content">
        {constellationInfo.type === 'none' ? (
          // No satellites state - show only subtle demo button
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-4">No constellation loaded</p>
              <button
                onClick={generateDefaultConstellation}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-sm border border-gray-500"
              >
                Generate Demo Constellation
              </button>
            </div>
          </div>
        ) : (
          // Satellites exist - show all controls
          <>
            {/* Status and Configuration in 2 columns */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              {/* Constellation Status Section */}
              <div className="p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Status</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Type: <span className="text-white">
                    {constellationInfo.type === 'demo' ? 'Demo' : 'Custom'}
                  </span></div>
                  <div>Satellites: <span className="text-white">{constellationInfo.satelliteCount}</span></div>
                  {constellationInfo.generatedAt && (
                    <div>Generated: <span className="text-white">
                      {constellationInfo.generatedAt.toLocaleTimeString()}
                    </span></div>
                  )}
                  {constellationInfo.coverage && (
                    <div>Coverage Calc: <span className="text-white">
                      {constellationInfo.coverage.calculatedAt.toLocaleTimeString()}
                    </span></div>
                  )}
                </div>
              </div>

              {/* Configuration Details Section */}
              <div className="p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Config</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <>
                    <div>Planes: <span className="text-white">{constellationInfo.config.planes}</span></div>
                    <div>Sats/Plane: <span className="text-white">{constellationInfo.config.satellitesPerPlane}</span></div>
                    <div>Inclination: <span className="text-white">{constellationInfo.config.inclination}°</span></div>
                    <div>Duration: <span className="text-white">{constellationInfo.config.simulationDays} days</span></div>
                  </>
                </div>
              </div>
            </div>

            {/* Constellation Controls */}
            <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Constellation</h3>
              <div className="space-y-3">
                {/* Satellites and Planes Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Total Satellites (1-60)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={customSatellites}
                      onChange={(e) => setCustomSatellites(parseInt(e.target.value) ?? 1)}
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Number of Planes (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={customPlanes}
                      onChange={(e) => {
                        const newPlanes = parseInt(e.target.value) ?? 1;
                        setCustomPlanes(newPlanes);
                        // Resize altitudes array to match
                        const newAltitudes = Array(newPlanes).fill(400).map((_, i) => customAltitudes[i] ?? 400);
                        setCustomAltitudes(newAltitudes);
                      }}
                      className="w-full px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                </div>
                
                {/* Dynamic Altitude Sliders */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Orbital Plane Altitudes</label>
                  <div className="space-y-2">
                    {customAltitudes.map((altitude, index) => {
                      // Generate dynamic colors using HSL (same as constellation generation)
                      const hue = (index * 360) / customPlanes;
                      const saturation = 80; // 0.8 * 100
                      const lightness = 60;   // 0.6 * 100
                      
                      // Convert HSL to CSS color for sliders
                      const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                      
                      // RAAN calculation
                      const raan = Math.round((index * 360) / customPlanes);
                      
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-xs font-semibold"
                              style={{ color: hslColor }}
                            >
                              RAAN {raan}°
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
                              onChange={(e) => {
                                const newAltitudes = [...customAltitudes];
                                newAltitudes[index] = parseInt(e.target.value);
                                setCustomAltitudes(newAltitudes);
                              }}
                              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, ${hslColor} 0%, ${hslColor} ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 100%)`
                              }}
                            />
                            <span className="text-xs text-gray-500">2000km</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Button Grid 2x2 Layout */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={applyCurrentConstellation}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold"
              >
                Apply Changes
              </button>
              
              <button
                onClick={generateDefaultConstellation}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-gray-200 rounded text-xs border border-gray-500"
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
            </div>
          </>
        )}
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default ConstellationDetailsPanel; 