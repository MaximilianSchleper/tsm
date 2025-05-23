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
    initialPosition: { top: 600, left: 1000 - 380 },
    initialSize: { width: 280, height: 280 },
    minWidth: 280,
    minHeight: 280,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition(prevPos => ({ ...prevPos, left: window.innerWidth - (size.width + 40) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // console.log("[SatelliteDetailsPanel] useEffect running. selectedSatellite:", selectedSatellite, "Viewer defined:", !!viewer);
    // eslint-disable-next-line
    if (selectedSatellite && selectedSatellite.position && viewer) {
      // console.log("[SatelliteDetailsPanel] useEffect - conditions met for updating position.");
      const updatePosition = () => {
        const positionVal = selectedSatellite?.position?.getValue(
          viewer?.clock?.currentTime, 
          new Cesium.Cartesian3()
        );

        if (positionVal) {
          setCurrentPosition(positionVal);
        }
      };

      // Initial update
      updatePosition();

      // Subscribe to clock ticks to update position dynamically
      // Ensure viewer.clock exists before trying to add/remove listener
      if (viewer.clock) {
        viewer.clock.onTick.addEventListener(updatePosition);
      }

      // Cleanup function to remove the event listener
      return () => {
        if (viewer.clock) {
          viewer.clock.onTick.removeEventListener(updatePosition);
        }
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
            {/* Satellite Info Section */}
            <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Satellite Info</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Name: <span className="text-white">{selectedSatellite.name ?? 'N/A'}</span></div>
                <div>ID: <span className="text-white">{selectedSatellite.id}</span></div>
              </div>
            </div>

            {/* Position Section */}
            {currentPosition && (
              <div className="mb-4 p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Position (ECEF)</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>X: <span className="text-white">{currentPosition.x.toFixed(0)} m</span></div>
                  <div>Y: <span className="text-white">{currentPosition.y.toFixed(0)} m</span></div>
                  <div>Z: <span className="text-white">{currentPosition.z.toFixed(0)} m</span></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-800 rounded border border-gray-600">
            <div className="text-sm text-gray-500 text-center">No satellite selected..</div>
          </div>
        )}
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default SatelliteDetailsPanel; 