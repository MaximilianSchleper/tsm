import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import TopBar from './TopBar';
// import TaskSchedulePanel from './TaskSchedulePanel';
import ConstellationDetailsPanel from './ConstellationDetailsPanel';
import SatelliteDetailsPanel from './SatelliteDetailsPanel';
import ExitButton from './ExitButton';
import type * as Cesium from 'cesium';

const GlobeViewer = dynamic(() => import('./GlobeViewer'), { ssr: false });

const Layout = () => {
  const [selectedSatellite, setSelectedSatelliteState] = useState<Cesium.Entity | null>(null);
  const [showSatellitePanel, setShowSatellitePanel] = useState(true);
  const [showConstellationPanel, setShowConstellationPanel] = useState(true);

  const setSelectedSatellite = useCallback((satellite: Cesium.Entity | null) => {
    // console.log("[Layout] setSelectedSatellite in useCallback called with:", satellite);
    setSelectedSatelliteState(satellite);
  }, []);

  const toggleSatellitePanel = useCallback(() => {
    setShowSatellitePanel(prev => !prev);
  }, []);

  const toggleConstellationPanel = useCallback(() => {
    setShowConstellationPanel(prev => !prev);
  }, []);

  // console.log("[Layout] Selected Satellite state (re-render check):", selectedSatellite);

  return (
    <div className="layout-container">
      <ExitButton />
      <div className="globe-viewer-background">
        <GlobeViewer setSelectedSatellite={setSelectedSatellite}> 
          {/* UI panels are now children of GlobeViewer to access Cesium context */}
          <TopBar 
            showSatellitePanel={showSatellitePanel}
            showConstellationPanel={showConstellationPanel}
            toggleSatellitePanel={toggleSatellitePanel}
            toggleConstellationPanel={toggleConstellationPanel}
          />
          {/* <TaskSchedulePanel /> */}
          <div 
            className={`animate-in fade-in duration-300 ${showConstellationPanel ? '' : 'hidden'}`}
          >
            <ConstellationDetailsPanel 
              setSelectedSatellite={setSelectedSatellite}
              onClose={toggleConstellationPanel}
            />
          </div>
          <div 
            className={`animate-in fade-in duration-300 ${showSatellitePanel ? '' : 'hidden'}`}
          >
            <SatelliteDetailsPanel 
              selectedSatellite={selectedSatellite}
              onClose={toggleSatellitePanel}
            />
          </div>
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