import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
// import TopBar from './TopBar';
// import TaskSchedulePanel from './TaskSchedulePanel';
import ConstellationDetailsPanel from './ConstellationDetailsPanel';
import SatelliteDetailsPanel from './SatelliteDetailsPanel';
import type * as Cesium from 'cesium';

const GlobeViewer = dynamic(() => import('../components/GlobeViewer'), { ssr: false });

const Layout = () => {
  const [selectedSatellite, setSelectedSatelliteState] = useState<Cesium.Entity | null>(null);

  const setSelectedSatellite = useCallback((satellite: Cesium.Entity | null) => {
    // console.log("[Layout] setSelectedSatellite in useCallback called with:", satellite);
    setSelectedSatelliteState(satellite);
  }, []);

  // console.log("[Layout] Selected Satellite state (re-render check):", selectedSatellite);

  return (
    <div className="layout-container">
      <div className="globe-viewer-background">
        <GlobeViewer setSelectedSatellite={setSelectedSatellite}> 
          {/* UI panels are now children of GlobeViewer to access Cesium context */}
          {/* TopBar and TaskSchedulePanel hidden for hackathon demo */}
          {/* <TopBar /> */}
          {/* <TaskSchedulePanel /> */}
          <ConstellationDetailsPanel />
          <SatelliteDetailsPanel selectedSatellite={selectedSatellite} /> 
        </GlobeViewer>
      </div>
       {/* Remove panels from here as they are now children of GlobeViewer 
       <TopBar />
       <TaskSchedulePanel />
       <ConstellationDetailsPanel />*/}
    </div>
  );
};

export default Layout; 