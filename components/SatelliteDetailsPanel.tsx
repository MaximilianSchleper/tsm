import React, { useEffect } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';

const SatelliteDetailsPanel = () => {
  const { 
    position, 
    size, 
    setPosition,
    handleMouseDownDrag, 
    handleMouseDownResize, 
    isResizable 
  } = useDraggableResizable({
    initialPosition: { top: 360, left: 1000 - 320 },
    initialSize: { width: 280, height: 180 },
    minWidth: 250,
    minHeight: 150,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition(prevPos => ({ ...prevPos, left: window.innerWidth - (size.width + 40) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="placeholder-box">
          Selected Satellite Information Placeholder
        </div>
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default SatelliteDetailsPanel; 