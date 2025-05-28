import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../../../hooks/useDraggableResizable';
import { useCesium } from 'resium';
import * as satellite from 'satellite.js';
import * as Cesium from 'cesium'; // Re-enable Cesium
import { generateDemoConstellationElements, generateOptimalConstellationElements, generateTLE } from '../../../lib/satellite-utils';
import { calculateInstantaneousCoverage } from '../../../lib/coverage-utils';
import { addConstellationCoverageZones, removeAllCoverageZones } from '../../../lib/coverage-visualization';

interface ConstellationDetailsPanelProps {
  setSelectedSatellite: (satellite: Cesium.Entity | null) => void;
  onClose?: () => void;
}

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

// Define orbital elements type for better type safety
interface OrbitalElements {
  altitude: number;
  inclination: number;
  raan: number;
  trueAnomaly: number;
  epoch: Date;
  satelliteNumber: number;
}

// Unified color generation function - used consistently across UI and constellation rendering
const generatePlaneColors = (numPlanes: number): { cesiumColors: Cesium.Color[], cssColors: string[] } => {
  const cesiumColors: Cesium.Color[] = [];
  const cssColors: string[] = [];
  
  for (let i = 0; i < numPlanes; i++) {
    const hue = (i * 360) / numPlanes; // Evenly distribute hues
    const saturation = 0.8; // 80%
    const lightness = 0.6;  // 60%
    
    // Cesium color for satellite rendering
    cesiumColors.push(Cesium.Color.fromHsl(hue / 360, saturation, lightness));
    
    // CSS color for UI elements
    cssColors.push(`hsl(${hue}, ${saturation * 100}%, ${lightness * 100}%)`);
  }
  
  return { cesiumColors, cssColors };
};

const ConstellationDetailsPanel: React.FC<ConstellationDetailsPanelProps> = ({ setSelectedSatellite, onClose }) => {
  const { viewer } = useCesium();

  // Constants
  const DEMO_PLANES = 4;
  const DEMO_SATS_PER_PLANE = 2;
  const DEFAULT_ALTITUDE = 550;
  const SIMULATION_DAYS = 3;
  const INCLINATION = 65;
  const CLOCK_MULTIPLIER = 300; // 5-minute real-time = 1 day simulation
  const SELECTION_RESTORE_DELAY = 100; // ms

  const [constellationInfo, setConstellationInfo] = useState<ConstellationInfo>({
    type: 'none',
    satelliteCount: 0,
    generatedAt: null,
    config: {}
  });
  const [showCoverageZones, setShowCoverageZones] = useState(false);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  
  // Track previous animation state to detect external changes
  const prevAnimationStateRef = React.useRef<boolean>(false);
  
  // Track coverage zones visibility synchronously (avoids React state timing issues)
  const showCoverageZonesRef = React.useRef<boolean>(false);
  
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
    initialPosition: { top: 70, left: 420 }, // Fixed position that doesn't depend on window width initially
    initialSize: { width: 460, height: 810 }, // Slightly smaller height
    minWidth: 460,
    minHeight: 550,
  });

  // Position the panel on the right side of the screen when window loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Position on the right side with some margin, but not overlapping
      const rightPosition = Math.max(420, window.innerWidth - size.width - 20);
      setPosition(prevPos => ({ ...prevPos, left: rightPosition }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only on mount

  // Monitor animation state
  useEffect(() => {
    if (!viewer?.clock) return;

    const checkAnimationState = () => {
      const currentAnimationState = viewer.clock.shouldAnimate;
      const prevAnimationState = prevAnimationStateRef.current;
      
      // Only log and process if there's an actual state change
      if (prevAnimationState !== currentAnimationState) {
        // Use ref for immediate, synchronous coverage zone detection
        const currentShowCoverageZones = showCoverageZonesRef.current;
        
        console.log('[Animation Monitor] 🔄 State change detected:', {
          prev: prevAnimationState,
          current: currentAnimationState,
          coverageVisible: currentShowCoverageZones,
          coverageVisibleState: showCoverageZones, // Also log React state for comparison
          transition: !prevAnimationState && currentAnimationState ? 'EXTERNAL_RESUME' : 
                     prevAnimationState && !currentAnimationState ? 'EXTERNAL_PAUSE' : 'other'
        });
        
        // Detect external animation resume (false → true) and auto-hide coverage zones
        if (!prevAnimationState && currentAnimationState && currentShowCoverageZones) {
          console.log('[Animation Monitor] External resume detected - hiding coverage zones');
          // External resume detected while coverage zones are visible - hide them for consistency
          try {
            removeAllCoverageZones(viewer);
            setShowCoverageZones(false);
            showCoverageZonesRef.current = false; // Update ref immediately
          } catch (error) {
            console.error('[Animation Monitor] ❌ Error removing coverage zones:', error);
          }
        }
        
        // Update states
        prevAnimationStateRef.current = currentAnimationState;
      }
      
      // Always update isAnimationPlaying to keep UI in sync
      setIsAnimationPlaying(currentAnimationState);
    };

    // Check initial state
    checkAnimationState();

    // Monitor clock changes
    viewer.clock.onTick.addEventListener(checkAnimationState);

    return () => {
      viewer.clock.onTick.removeEventListener(checkAnimationState);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]); // Removed showCoverageZones to fix circular dependency

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

  // Shared constellation generation logic
  const generateConstellationBase = React.useCallback((
    elements: OrbitalElements[],
    colors: Cesium.Color[],
    satelliteNaming: (index: number, planeIndex: number, satInPlane: number) => { name: string; id: string },
    preserveCurrentTime = false,
    constellationType: 'demo' | 'custom',
    configOverrides: Partial<ConstellationInfo['config']> = {},
    autoShowCoverage = false
  ) => {
    if (!viewer) {
      console.error("Cesium viewer is not available");
      return;
    }

    try {
      // Preserve current simulation time if requested (for Apply Changes)
      const currentSimulationTime = preserveCurrentTime && viewer.clock.currentTime 
        ? Cesium.JulianDate.toDate(viewer.clock.currentTime)
        : null;

      // Clear all existing satellites and reset coverage state
      viewer.entities.removeAll();
      setShowCoverageZones(false);
      showCoverageZonesRef.current = false; // Reset ref

      // Time setup with dynamic resolution based on satellite count
      const startTime = currentSimulationTime ?? new Date();
      const durationDays = SIMULATION_DAYS; // 3 days for better performance with large constellations
      
      // When preserving time, center the time range around the current time
      // Otherwise, start from the current time
      let pathStartTime: Date;
      let pathEndTime: Date;
      
      if (currentSimulationTime) {
        // Center 3-day window around current simulation time
        const halfDuration = (durationDays * 24 * 60 * 60 * 1000) / 2;
        pathStartTime = new Date(currentSimulationTime.getTime() - halfDuration);
        pathEndTime = new Date(currentSimulationTime.getTime() + halfDuration);
      } else {
        // Start from current time for new constellations
        pathStartTime = startTime;
        pathEndTime = new Date(startTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
      
      // Dynamic time resolution based on satellite count for optimal UX
      const satelliteCount = elements.length;
      const timeStepSeconds = satelliteCount <= 8 ? 60 :    // 1-8 sats: 1-min (smooth orbits)
                             satelliteCount <= 16 ? 120 :   // 9-16 sats: 2-min (good detail)
                             satelliteCount <= 32 ? 240 :   // 17-32 sats: 4-min (balanced)
                             300;                            // 33+ sats: 5-min (performance)

      // Store satellite records for coverage calculation
      const satelliteRecords: satellite.SatRec[] = [];
      const satelliteIds: string[] = [];

      // Calculate satellites per plane for demo/custom logic
      const numPlanes = constellationType === 'demo' ? DEMO_PLANES : customPlanes;
      const satellitesPerPlane: number[] = [];
      
      if (constellationType === 'demo') {
        satellitesPerPlane.push(DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE); // Fixed 2 per plane for demo
      } else {
        const baseSatsPerPlane = Math.floor(elements.length / numPlanes);
        const extraSats = elements.length % numPlanes;
        for (let i = 0; i < numPlanes; i++) {
          satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
        }
      }

      // Generate and add each satellite
      let currentPlane = 0;
      let satInPlane = 0;
      
      elements.forEach((satelliteElements, index) => {
        // Determine which plane this satellite belongs to
        if (constellationType === 'custom') {
          while (satInPlane >= (satellitesPerPlane[currentPlane] ?? 0)) {
            currentPlane++;
            satInPlane = 0;
          }
        } else {
          // Demo: simple 2 per plane logic
          currentPlane = Math.floor(index / 2);
          satInPlane = index % 2;
        }
        
        const color = colors[currentPlane];
        if (!color) {
          console.error(`ERROR: No color defined for plane ${currentPlane}`);
          return;
        }
        
        const { name: satName, id: satelliteId } = satelliteNaming(index, currentPlane, satInPlane);

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

        for (let currentTime = new Date(pathStartTime.getTime()); currentTime <= pathEndTime; currentTime.setTime(currentTime.getTime() + timeStepSeconds * 1000)) {
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
            start: Cesium.JulianDate.fromDate(pathStartTime),
            stop: Cesium.JulianDate.fromDate(pathEndTime),
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
        
        if (constellationType === 'custom') {
          satInPlane++;
        }
      });

      // Update viewer clock - preserve current time if requested
      viewer.clock.startTime = Cesium.JulianDate.fromDate(startTime);
      viewer.clock.stopTime = Cesium.JulianDate.fromDate(pathEndTime);
      if (currentSimulationTime) {
        // Keep the current simulation time when applying changes
        viewer.clock.currentTime = Cesium.JulianDate.fromDate(currentSimulationTime);
      } else {
        // Start from beginning for new constellations
        viewer.clock.currentTime = Cesium.JulianDate.fromDate(startTime);
      }
      viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
      viewer.clock.multiplier = CLOCK_MULTIPLIER;

      // Update constellation info with provided config overrides
      const baseConfig = {
        inclination: INCLINATION,
        simulationDays: SIMULATION_DAYS
      };

      setConstellationInfo({
        type: constellationType,
        satelliteCount: elements.length,
        generatedAt: new Date(),
        config: { ...baseConfig, ...configOverrides },
        satelliteRecords: satelliteRecords,
        satelliteIds: satelliteIds
      });

      // Auto-show coverage zones if requested (uses fresh satellite data)
      if (autoShowCoverage) {
        console.log('Auto-showing coverage zones with fresh constellation data');
        
        // Create coverage zones at current simulation time using fresh data
        const currentTime = currentSimulationTime ?? startTime;
        
        // Generate colors and satellite-to-plane mapping
        let satellitesPerPlane: number[] = [];
        
        if (constellationType === 'demo') {
          satellitesPerPlane = [DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE];
        } else {
          // Custom constellation: calculate satellites per plane
          const baseSatsPerPlane = Math.floor(elements.length / numPlanes);
          const extraSats = elements.length % numPlanes;
          for (let i = 0; i < numPlanes; i++) {
            satellitesPerPlane.push(baseSatsPerPlane + (i < extraSats ? 1 : 0));
          }
        }

        // Map satellites to planes and colors
        const satelliteData = satelliteRecords
          .map((satrec, index) => {
            const id = satelliteIds[index];
            if (!id) return null;
            
            // Determine which plane this satellite belongs to (same logic as generation)
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

        // Create coverage zones with fresh data
        addConstellationCoverageZones(viewer, satelliteData, colors, currentTime);
        
        // Calculate and update coverage percentage
        const coverageResult = calculateInstantaneousCoverage(satelliteRecords, currentTime);
        
        // Update constellation info with coverage (need to do this after the initial setConstellationInfo)
        setTimeout(() => {
          setConstellationInfo(prev => ({
            ...prev,
            coverage: {
              globalPercentage: coverageResult.globalPercentage,
              calculatedAt: coverageResult.calculatedAt
            }
          }));
        }, 0);
        
        // Update coverage state
        setShowCoverageZones(true);
        showCoverageZonesRef.current = true;
        
        console.log('✅ Auto-coverage zones created with fresh data');
      }

    } catch (error) {
      console.error("ERROR during constellation generation:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      }
    }
  }, [viewer, customPlanes, setShowCoverageZones, setConstellationInfo]);

  const generateDemoConstellation = (preserveCurrentTime = false, useCustomAltitudes = false) => {
    try {
      // Generate base orbital elements for 8 satellites
      const baseElements = generateDemoConstellationElements();

      // Modify altitudes if requested
      if (useCustomAltitudes) {
        baseElements.forEach((elements, index) => {
          const planeIndex = Math.floor(index / DEMO_SATS_PER_PLANE); // 2 satellites per plane
          const customAltitude = customAltitudes[planeIndex] ?? DEFAULT_ALTITUDE;
          elements.altitude = customAltitude;
        });
      }

      // Use unified color generation for 4 planes (demo constellation)
      const { cesiumColors } = generatePlaneColors(DEMO_PLANES);

      // Use actual altitudes for config
      const actualAltitudes = useCustomAltitudes 
        ? [customAltitudes[0] ?? DEFAULT_ALTITUDE, customAltitudes[1] ?? DEFAULT_ALTITUDE, customAltitudes[2] ?? DEFAULT_ALTITUDE, customAltitudes[3] ?? DEFAULT_ALTITUDE]
        : [DEFAULT_ALTITUDE, DEFAULT_ALTITUDE, DEFAULT_ALTITUDE, DEFAULT_ALTITUDE];

      generateConstellationBase(
        baseElements, 
        cesiumColors, 
        (index, planeIndex, satInPlane) => ({
          name: `Demo-${planeIndex + 1}${satInPlane === 0 ? 'A' : 'B'}`,
          id: `demo-satellite-${baseElements[index]?.satelliteNumber ?? index}`,
        }), 
        preserveCurrentTime, 
        'demo', 
        {
          planes: DEMO_PLANES,
          satellitesPerPlane: DEMO_SATS_PER_PLANE,
          altitude: DEFAULT_ALTITUDE,
          altitudesByPlane: actualAltitudes,
          inclination: INCLINATION,
          simulationDays: SIMULATION_DAYS
        }
      );

    } catch (error) {
      console.error("ERROR during demo constellation generation:", error);
    }
  };

  const generateDefaultConstellation = () => {
    // Reset to demo constellation defaults
    setCustomSatellites(8);
    setCustomPlanes(DEMO_PLANES);
    setCustomAltitudes([DEFAULT_ALTITUDE, DEFAULT_ALTITUDE, DEFAULT_ALTITUDE, DEFAULT_ALTITUDE]);
    generateDemoConstellation(false, false); // Don't preserve time, don't use custom altitudes
  };

  const generateCustomConstellation = React.useCallback((preserveCurrentTime = false, autoShowCoverage = false) => {
    try {
      // Validation
      if (customAltitudes.length !== customPlanes) {
        alert(`Number of altitudes (${customAltitudes.length}) must equal number of planes (${customPlanes})`);
        return;
      }

      console.log('generateCustomConstellation:', { preserveCurrentTime, autoShowCoverage });

      // Generate optimal constellation elements
      const elements = generateOptimalConstellationElements(
        customSatellites,
        customPlanes,
        customAltitudes
      );

      // Use the global unified color generation function
      const { cesiumColors: colors } = generatePlaneColors(customPlanes);

      generateConstellationBase(
        elements, 
        colors, 
        (index, planeIndex, satInPlane) => ({
          name: `Custom-${planeIndex + 1}${String.fromCharCode(65 + satInPlane)}`,
          id: `custom-satellite-${elements[index]?.satelliteNumber ?? index}`,
        }), 
        preserveCurrentTime, 
        'custom', 
        {
          planes: customPlanes,
          satellitesPerPlane: Math.round(customSatellites / customPlanes),
          altitudesByPlane: customAltitudes,
          inclination: INCLINATION,
          simulationDays: SIMULATION_DAYS
        },
        autoShowCoverage // Pass the flag to generateConstellationBase
      );

    } catch (error) {
      console.error("ERROR during custom constellation generation:", error);
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      }
    }
  }, [customSatellites, customPlanes, customAltitudes, generateConstellationBase]);

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
    showCoverageZonesRef.current = false; // Reset ref
    
    // Clear selected satellite
    setSelectedSatellite(null);
    
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

  // Helper function to create coverage zones - extracts duplicated logic
  const createCoverageZones = React.useCallback(() => {
    if (!viewer || !constellationInfo.satelliteRecords || !constellationInfo.satelliteIds) {
      return;
    }

    const currentTime = Cesium.JulianDate.toDate(viewer.clock.currentTime);
    
    // Generate colors and satellite-to-plane mapping based on constellation type
    let colors: Cesium.Color[] = [];
    let satellitesPerPlane: number[] = [];
    
    if (constellationInfo.type === 'demo') {
      // Demo constellation: 4 planes, 2 satellites per plane - use unified colors
      const { cesiumColors } = generatePlaneColors(DEMO_PLANES);
      colors = cesiumColors;
      satellitesPerPlane = [DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE, DEMO_SATS_PER_PLANE];
    } else {
      // Custom constellation: use current parameters - use unified colors
      const numPlanes = customPlanes;
      const numSatellites = customSatellites;
      
      const { cesiumColors } = generatePlaneColors(numPlanes);
      colors = cesiumColors;
      
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
    showCoverageZonesRef.current = true; // Update ref immediately
  }, [viewer, constellationInfo, customPlanes, customSatellites]);

  const toggleAnimationAndCoverage = () => {
    if (!viewer || !constellationInfo.satelliteRecords || !constellationInfo.satelliteIds) {
      console.log('[Panel Button] ❌ Cannot toggle - missing viewer or constellation data');
      return;
    }

    console.log('[Panel Button] Toggle triggered:', {
      isAnimationPlaying,
      showCoverageZones,
      action: isAnimationPlaying ? 'PAUSE_AND_SHOW' : showCoverageZones ? 'RESUME_AND_HIDE' : 'SHOW_COVERAGE'
    });

    if (isAnimationPlaying) {
      // Currently playing -> pause animation and show coverage
      console.log('[Panel Button] Pausing animation and showing coverage');
      viewer.clock.shouldAnimate = false;
      
      // Show coverage zones at current simulation time
      createCoverageZones();
    } else if (showCoverageZones) {
      // Currently paused with coverage shown -> resume animation and hide coverage
      console.log('[Panel Button] Resuming animation and hiding coverage');
      viewer.clock.shouldAnimate = true;
      try {
        removeAllCoverageZones(viewer);
        setShowCoverageZones(false);
        showCoverageZonesRef.current = false; // Update ref immediately
      } catch (error) {
        console.error('[Panel Button] ❌ Error removing coverage zones:', error);
      }
    } else {
      // Currently paused without coverage -> show coverage (keep paused)
      console.log('[Panel Button] Showing coverage (keep paused)');
      createCoverageZones();
    }
  };

  const applyCurrentConstellation = () => {
    if (!viewer) return;
    
    // Store the currently selected satellite info before regeneration
    const currentlySelectedSatellite = viewer.selectedEntity;
    let selectedSatelliteId: string | null = null;
    let selectedSatelliteName: string | null = null;
    
    if (currentlySelectedSatellite && typeof currentlySelectedSatellite.id === 'string') {
      selectedSatelliteId = currentlySelectedSatellite.id;
      selectedSatelliteName = currentlySelectedSatellite.name ?? null;
      console.log('📌 Saving selected satellite:', selectedSatelliteId, selectedSatelliteName);
    }

    // Check if coverage zones were visible and animation is paused before regeneration
    const shouldRestoreCoverageZones = showCoverageZonesRef.current && !isAnimationPlaying;
    console.log('🔄 Apply Changes:', {
      zonesVisible: showCoverageZonesRef.current,
      animationPaused: !isAnimationPlaying,
      shouldRestoreZones: shouldRestoreCoverageZones
    });

    // Always use custom constellation when applying changes since user is setting custom parameters
    // This ensures that satellite count and plane count changes are respected
    // Pass shouldRestoreCoverageZones as autoShowCoverage to create zones with fresh data
    generateCustomConstellation(true, shouldRestoreCoverageZones);

    // After constellation regeneration, attempt to restore selection
    // Use a small delay to ensure entities are fully created
    setTimeout(() => {
      if (selectedSatelliteId && viewer) {
        const newEntity = viewer.entities.getById(selectedSatelliteId);
        if (newEntity) {
          console.log('✅ Restored selection to:', selectedSatelliteId);
          viewer.selectedEntity = newEntity;
          setSelectedSatellite(newEntity);
        } else {
          console.log('❌ Could not find satellite with ID:', selectedSatelliteId);
          // Clear selection if the satellite can't be found
          viewer.selectedEntity = undefined;
          setSelectedSatellite(null);
        }
      }
    }, SELECTION_RESTORE_DELAY); // 100ms delay to ensure entities are created
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
          <div className="flex items-center space-x-2">
            {constellationInfo.coverage && (
              <>
                <span className="text-xs text-gray-300">Coverage:</span>
                <span className="text-green-400 font-bold text-lg bg-green-400/10 px-2 py-1 rounded border border-green-400/30">
                  {constellationInfo.coverage.globalPercentage}%
                </span>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 flex items-center justify-center text-[#E0E0E0] hover:text-[#FFB74D] hover:bg-[rgba(255,183,77,0.1)] rounded transition-colors duration-200 ml-2"
                title="Close Panel"
              >
                ×
              </button>
            )}
          </div>
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
                Generate Default Constellation
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
              <div className="space-y-4">
                {/* Satellites and Planes Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Satellites Control */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 font-medium">Total Satellites</label>
                    <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600">
                      <button
                        onClick={() => setCustomSatellites(Math.max(1, customSatellites - 1))}
                        className="p-2 hover:bg-gray-600 rounded-l-lg transition-colors border-r border-gray-600 text-gray-300 hover:text-white"
                        disabled={customSatellites <= 1}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 12.998H5v-2h14z"/>
                        </svg>
                      </button>
                      <div className="flex-1 px-3 py-2 bg-gray-700 text-center">
                        <span className="text-white font-semibold text-lg">{customSatellites}</span>
                        <div className="text-xs text-gray-400">satellites</div>
                      </div>
                      <button
                        onClick={() => setCustomSatellites(Math.min(60, customSatellites + 1))}
                        className="p-2 hover:bg-gray-600 rounded-r-lg transition-colors border-l border-gray-600 text-gray-300 hover:text-white"
                        disabled={customSatellites >= 60}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">Range: 1-60</div>
                  </div>
                  
                  {/* Number of Planes Control */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 font-medium">Orbital Planes</label>
                    <div className="flex items-center bg-gray-700 rounded-lg border border-gray-600">
                      <button
                        onClick={() => {
                          const newPlanes = Math.max(1, customPlanes - 1);
                          setCustomPlanes(newPlanes);
                          // Resize altitudes array to match
                          const newAltitudes = Array(newPlanes).fill(400).map((_, i) => customAltitudes[i] ?? 400);
                          setCustomAltitudes(newAltitudes);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-l-lg transition-colors border-r border-gray-600 text-gray-300 hover:text-white"
                        disabled={customPlanes <= 1}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 12.998H5v-2h14z"/>
                        </svg>
                      </button>
                      <div className="flex-1 px-3 py-2 bg-gray-700 text-center">
                        <span className="text-white font-semibold text-lg">{customPlanes}</span>
                        <div className="text-xs text-gray-400">planes</div>
                      </div>
                      <button
                        onClick={() => {
                          const newPlanes = Math.min(10, customPlanes + 1);
                          setCustomPlanes(newPlanes);
                          // Resize altitudes array to match
                          const newAltitudes = Array(newPlanes).fill(400).map((_, i) => customAltitudes[i] ?? 400);
                          setCustomAltitudes(newAltitudes);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-r-lg transition-colors border-l border-gray-600 text-gray-300 hover:text-white"
                        disabled={customPlanes >= 10}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 12.998h-6v6h-2v-6H5v-2h6v-6h2v6h6z"/>
                        </svg>
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 text-center">Range: 1-10</div>
                  </div>
                </div>
                
                {/* Dynamic Altitude Sliders */}
                <div>
                  <label className="text-sm text-gray-300 block mb-3 font-medium">Orbital Plane Altitudes</label>
                  <div className="space-y-3">
                    {customAltitudes.map((altitude, index) => {
                      // Use unified color generation
                      const { cssColors } = generatePlaneColors(customPlanes);
                      const hslColor = cssColors[index] ?? 'hsl(0, 80%, 60%)';
                      
                      // RAAN calculation
                      const raan = Math.round((index * 360) / customPlanes);
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span 
                              className="text-sm font-semibold"
                              style={{ color: hslColor }}
                            >
                              RAAN {raan}°
                            </span>
                            <span className="text-sm text-white font-medium">{altitude} km</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500 w-8">160</span>
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
                              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, ${hslColor} 0%, ${hslColor} ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 ${((altitude - 160) / (2000 - 160)) * 100}%, #374151 100%)`
                              }}
                            />
                            <span className="text-xs text-gray-500 w-8">2000</span>
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
                Reset to Default
              </button>
              
              <button
                onClick={clearConstellation}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
              >
                Clear All
              </button>
              
              <button
                onClick={toggleAnimationAndCoverage}
                disabled={!constellationInfo.satelliteRecords}
                className={`px-3 py-2 text-white rounded text-xs ${
                  !constellationInfo.satelliteRecords
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : isAnimationPlaying
                    ? 'bg-purple-500 hover:bg-purple-600'
                    : showCoverageZones
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {!constellationInfo.satelliteRecords 
                  ? 'No Constellation' 
                  : isAnimationPlaying 
                  ? '⏸️ Pause & Analyze' 
                  : showCoverageZones
                  ? '▶️ Resume Animation'
                  : '🔍 Analyze Coverage'
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