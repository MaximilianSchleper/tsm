"use client";

import { Viewer, ImageryLayer, CesiumComponentRef, GeoJsonDataSource } from "resium";
import * as Cesium from "cesium";
import React, { useMemo, useRef, useEffect } from 'react';

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

const GlobeViewer = () => {
  const viewerRef = useRef<CesiumComponentRef<Cesium.Viewer>>(null);

  const imageryProvider = useMemo(() => new Cesium.SingleTileImageryProvider({
    url: "/EarthMap.jpg",
    rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
    tileWidth: 4096,
    tileHeight: 2048,
  }), []);

  const gridImageryProvider = new Cesium.GridImageryProvider({
    tilingScheme: new Cesium.GeographicTilingScheme(),
    cells: 8,
    glowWidth: 0,
    color: Cesium.Color.GREY.withAlpha(0.5),
  });

  // Create a dummy div for the credit container to hide default credits
  const dummyCreditContainer = typeof document !== 'undefined' ? document.createElement('div') : undefined;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const cesiumViewerInstance = viewerRef.current?.cesiumElement;
      if (cesiumViewerInstance) {
        const canvas = cesiumViewerInstance.canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        cesiumViewerInstance.resize();
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Viewer
      ref={viewerRef}
      baseLayerPicker={false}
      geocoder={true}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      animation={false}
      timeline={false}
      fullscreenButton={false}
      infoBox={false}
      creditContainer={dummyCreditContainer}
      selectionIndicator={false}
    >
      <ImageryLayer imageryProvider={imageryProvider} />
      <ImageryLayer imageryProvider={gridImageryProvider} />
      <GeoJsonDataSource
        data="/ne_110m_admin_0_countries.geojson"
        stroke={Cesium.Color.CYAN.withAlpha(0.5)}
        strokeWidth={2}
      />
    </Viewer>
  );
};

export default GlobeViewer; 