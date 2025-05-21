import React from 'react';
import dynamic from 'next/dynamic';
import TopBar from './TopBar';
import TaskSchedulePanel from './TaskSchedulePanel';
import ConstellationDetailsPanel from './ConstellationDetailsPanel';
import SatelliteDetailsPanel from './SatelliteDetailsPanel';

const GlobeViewer = dynamic(() => import('../components/GlobeViewer'), { ssr: false });

const Layout = () => {
  return (
    <div className="layout-container">
      <div className="globe-viewer-background">
        <GlobeViewer>
          {/* UI panels are now children of GlobeViewer to access Cesium context */}
          <TopBar />
          <TaskSchedulePanel />
          <ConstellationDetailsPanel />
          <SatelliteDetailsPanel />
        </GlobeViewer>
      </div>
      
      {/* All UI panels are now self-positioning draggable/resizable windows */}
      {/* <TopBar /> */}
      {/* <TaskSchedulePanel /> */}
      {/* <ConstellationDetailsPanel /> */}
      {/* <SatelliteDetailsPanel /> */}
    </div>
  );
};

export default Layout; 