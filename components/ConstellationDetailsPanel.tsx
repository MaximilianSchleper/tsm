import React, { useEffect } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';

const ConstellationDetailsPanel = () => {
 const {
    position,
    size,
    setPosition,
    handleMouseDownDrag,
    handleMouseDownResize,
    isResizable
  } = useDraggableResizable({
    initialPosition: { top: 70, left: 1000 - 320 }, // Default for SSR
    initialSize: { width: 280, height: 220 },
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
      </div>
      {isResizable && <div className="resize-handle" onMouseDown={handleMouseDownResize}></div>}
    </div>
  );
};

export default ConstellationDetailsPanel; 