import React, { useEffect } from 'react';
import { useDraggableResizable } from '../hooks/useDraggableResizable';

const TopBar = () => {
  const {
    position,
    size,
    setPosition,
    setSize,
    handleMouseDownDrag,
    // No resize for TopBar
  } = useDraggableResizable({
    initialPosition: { top: 10, left: 10 }, 
    initialSize: { width: 800, height: 50 }, // Default for SSR, will be updated
    resizable: false, // TopBar is not resizable by default
    minWidth: 400, // Example min width if it were resizable
    minHeight: 50, // Fixed height
  });

  // Update size based on window dimensions on client side - Mount only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSize(prevSize => ({ ...prevSize, width: window.innerWidth * 0.75 }));
      // Example: If you wanted to center it with 75% width:
      // setPosition({ top: 10, left: (window.innerWidth * 0.25) / 2 }); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only on mount

  return (
    <div
      className="draggable-window top-bar-window" // top-bar-window for specific flex styles if needed
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        // Ensure specific top-bar styles are maintained or handled by top-bar-window class
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px', // Padding is now inside the draggable window
      }}
      onMouseDown={handleMouseDownDrag} // Entire TopBar is draggable
    >
      <div className="search-placeholder">Search Placeholder</div>
      <div className="menu-button-placeholder">Menu Button Placeholder</div>
    </div>
  );
};

export default TopBar; 