import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';

interface SatelliteDetailsPanelProps {
  selectedSatellite: Cesium.Entity | null;
}

const SatelliteDetailsPanel: React.FC<SatelliteDetailsPanelProps> = ({ selectedSatellite }) => {
  // console.log("[SatelliteDetailsPanel] Received props - selectedSatellite:", selectedSatellite);
  const { viewer } = useCesium();
  const [currentPosition, setCurrentPosition] = useState<Cesium.Cartesian3 | null>(null);

  const { 
    position, 
    size, 
    setPosition,
    handleMouseDownDrag, 
    handleMouseDownResize, 
    isResizable 
  } = useDraggableResizable({
    initialPosition: { top: 360, left: 1000 - 320 },
    initialSize: { width: 280, height: 220 },
    minWidth: 250,
    minHeight: 150,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition(prevPos => ({ ...prevPos, left: window.innerWidth - (size.width + 40) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // console.log("[SatelliteDetailsPanel] useEffect running. selectedSatellite:", selectedSatellite, "Viewer defined:", !!viewer);
    if (selectedSatellite && selectedSatellite.position && viewer) {
      // console.log("[SatelliteDetailsPanel] useEffect - conditions met for updating position.");
      const updatePosition = () => {
        const positionVal = selectedSatellite.position?.getValue(viewer.clock.currentTime, new Cesium.Cartesian3());
        // console.log("[SatelliteDetailsPanel] updatePosition - positionVal:", positionVal);
        if (positionVal) {
          setCurrentPosition(positionVal);
        }
      };

      // Initial update
      updatePosition();

      // Subscribe to clock ticks to update position dynamically
      viewer.clock.onTick.addEventListener(updatePosition);

      // Cleanup function to remove the event listener
      return () => {
        viewer.clock.onTick.removeEventListener(updatePosition);
      };
    } else {
      setCurrentPosition(null); // Clear position if no satellite selected
    }
  }, [selectedSatellite, viewer]);

  // console.log("[SatelliteDetailsPanel] Rendering with currentPosition:", currentPosition);
  return (
    <div
      className="draggable-window panel satellite-details-panel"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      <div className="window-header" onMouseDown={handleMouseDownDrag}>
        Satellite Details
      </div>
      <div className="window-content">
        {selectedSatellite ? (
          <div>
            <p>Name: {selectedSatellite.name ?? 'N/A'}</p>
            <p>ID: {selectedSatellite.id}</p>
            {currentPosition && (
              <div>
                <p>Position (ECEF):</p>
                <p>X: {currentPosition.x.toFixed(0)} m</p>
                <p>Y: {currentPosition.y.toFixed(0)} m</p>
                <p>Z: {currentPosition.z.toFixed(0)} m</p>
              </div>
            )}
          </div>
        ) : (
          <div className="placeholder-box">
            No satellite selected..
          </div>
        )}
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default SatelliteDetailsPanel; 