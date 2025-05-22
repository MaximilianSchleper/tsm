"use client";

import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";
import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import GlobeEventHandler from './GlobeEventHandler';

// Define the window type with CESIUM_BASE_URL
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// Ensure CESIUM_BASE_URL is set on the window object for Cesium to find its assets
if (typeof window !== 'undefined') {
  window.CESIUM_BASE_URL = "/cesium/";
}

interface GlobeViewerProps {
  children?: ReactNode;
  setSelectedSatellite?: (satellite: Cesium.Entity | null) => void;
}

const GlobeViewer: React.FC<GlobeViewerProps> = ({ children, setSelectedSatellite }) => {
  // console.log("[GlobeViewer] Component function executing.");

  const dummyCreditContainer = useMemo(() => 
     typeof document !== 'undefined' ? document.createElement('div') : undefined, []);

  const imageryProvider = useMemo(() => new Cesium.SingleTileImageryProvider({
    url: "/EarthMap.jpg",
    rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
    tileWidth: 4096,
    tileHeight: 2048,
  }), []);

  const gridImageryProvider = useMemo(() => new Cesium.GridImageryProvider({
    tilingScheme: new Cesium.GeographicTilingScheme(),
    cells: 8,
    glowWidth: 0,
    color: Cesium.Color.GREY.withAlpha(0.5),
  }), []);

  const viewerInstance = <
    Viewer full
    creditContainer={dummyCreditContainer}
    baseLayerPicker={false}
    homeButton={true}
    sceneModePicker={false}
    navigationHelpButton={false}
    selectionIndicator={true}
    infoBox={false}
  >
    <ImageryLayer imageryProvider={imageryProvider} />
    <ImageryLayer imageryProvider={gridImageryProvider} />
    <GlobeEventHandler setSelectedSatellite={setSelectedSatellite} />
    {children}
  </Viewer>;

  return (
    viewerInstance
  );
}

export default GlobeViewer;
