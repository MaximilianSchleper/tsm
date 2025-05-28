import React, { useEffect } from 'react';
import { useDraggableResizable } from '../../../hooks/useDraggableResizable';
import Image from 'next/image';

interface TopBarProps {
  showSatellitePanel: boolean;
  showConstellationPanel: boolean;
  toggleSatellitePanel: () => void;
  toggleConstellationPanel: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  showSatellitePanel, 
  showConstellationPanel, 
  toggleSatellitePanel, 
  toggleConstellationPanel 
}) => {
  const {
    position,
    size,
    handleMouseDownDrag,
    // No resize for TopBar
  } = useDraggableResizable({
    initialPosition: { top: 15, left: 140 }, 
    initialSize: { width: 250, height: 40 }, // Wide and short, all in one row
    resizable: false, // TopBar is not resizable by default
    minWidth: 250, 
    minHeight: 40,
  });

  // Keep fixed size for panel controls
  useEffect(() => {
    // No need to resize based on window for panel controls
  }, []);

  return (
    <div
      className="border border-[#FFB74D] bg-[rgba(20,20,25,0.7)] backdrop-blur-sm rounded-lg shadow-lg"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        cursor: 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDownDrag}
    >
      <span className="text-[#FFB74D] font-bold text-sm tracking-wide">PANEL CONTROLS</span>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={toggleSatellitePanel}
          className={`flex items-center justify-center w-7 h-7 rounded-lg border border-[#FFB74D] transition-all duration-200 ${
            showSatellitePanel 
              ? 'bg-[#FFB74D]' 
              : 'bg-[rgba(35,35,40,0.8)] hover:bg-[rgba(255,183,77,0.15)]'
          }`}
          title="Toggle Satellite Details Panel"
        >
          <Image 
            src="/satellite_alt.svg" 
            alt="Satellite" 
            width={16} 
            height={16}
            className={`${showSatellitePanel ? 'brightness-0' : 'brightness-0 invert'}`}
          />
        </button>
        
        <button
          onClick={toggleConstellationPanel}
          className={`flex items-center justify-center w-7 h-7 rounded-lg border border-[#FFB74D] transition-all duration-200 ${
            showConstellationPanel 
              ? 'bg-[#FFB74D]' 
              : 'bg-[rgba(35,35,40,0.8)] hover:bg-[rgba(255,183,77,0.15)]'
          }`}
          title="Toggle Constellation Details Panel"
        >
          <Image 
            src="/globe.svg" 
            alt="Globe" 
            width={16} 
            height={16}
            className={`${showConstellationPanel ? 'brightness-0' : 'brightness-0 invert'}`}
          />
        </button>
      </div>
    </div>
  );
};

export default TopBar; 