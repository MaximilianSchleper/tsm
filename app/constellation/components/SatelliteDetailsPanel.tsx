import React, { useEffect, useState } from 'react';
import { useDraggableResizable } from '../../../hooks/useDraggableResizable';
import * as Cesium from 'cesium';
import { useCesium } from 'resium';

interface SatelliteDetailsPanelProps {
  selectedSatellite: Cesium.Entity | null;
  onClose?: () => void;
}

const SatelliteDetailsPanel: React.FC<SatelliteDetailsPanelProps> = ({ selectedSatellite, onClose }) => {
  const { viewer } = useCesium();
  const [currentPosition, setCurrentPosition] = useState<Cesium.Cartesian3 | null>(null);

  const { 
    position, 
    size, 
    handleMouseDownDrag, 
    handleMouseDownResize, 
    isResizable 
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 20 }, // Better positioned below TopBar
    initialSize: { width: 380, height: 200 },
    minWidth: 380,
    minHeight: 180,
  });

  // No dynamic positioning needed since it's now on the left side
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     setPosition(prevPos => ({ ...prevPos, left: window.innerWidth - (size.width + 40) }));
  //   }
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    if (selectedSatellite?.position && viewer) {
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
        <span>Satellite Details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-[#E0E0E0] hover:text-[#FFB74D] hover:bg-[rgba(255,183,77,0.1)] rounded transition-colors duration-200"
            title="Close Panel"
          >
            ×
          </button>
        )}
      </div>
      <div className="window-content">
        {selectedSatellite ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Satellite Info Section */}
            <div className="p-3 bg-gray-800 rounded border border-gray-600">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Satellite Info</h3>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Name: <span className="text-white">{selectedSatellite.name ?? 'N/A'}</span></div>
                <div>ID: <span className="text-white">{selectedSatellite.id}</span></div>
                <div className="text-xs text-green-400 mt-2">
                  💡 Click satellite or coverage zone
                </div>
              </div>
            </div>

            {/* Position Section */}
            {currentPosition ? (
              <div className="p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Position (ECEF)</h3>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>X: <span className="text-white">{currentPosition.x.toFixed(0)} m</span></div>
                  <div>Y: <span className="text-white">{currentPosition.y.toFixed(0)} m</span></div>
                  <div>Z: <span className="text-white">{currentPosition.z.toFixed(0)} m</span></div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-800 rounded border border-gray-600">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Position</h3>
                <div className="text-xs text-gray-500">Loading position...</div>
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