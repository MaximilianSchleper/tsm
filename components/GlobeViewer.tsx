"use client";

import { Viewer, ImageryLayer, CesiumComponentRef, GeoJsonDataSource, Clock, Globe } from "resium";
import * as Cesium from "cesium";
import React, { useMemo, useRef } from 'react';

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

  // Get current date for clock
  const now = useMemo(() => Cesium.JulianDate.fromDate(new Date()), []);
  const stop = useMemo(() => {
    const future = Cesium.JulianDate.addDays(now, 2, new Cesium.JulianDate());
    return future;
  }, [now]);

  return (
    <div className="relative w-full h-full">
      <Viewer
        ref={viewerRef}
        baseLayerPicker={false}
        geocoder={true}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        animation={true}
        timeline={true}
        fullscreenButton={false}
        infoBox={false}
        creditContainer={dummyCreditContainer}
        selectionIndicator={false}
      >
        <Globe 
          enableLighting={true}
          showGroundAtmosphere={true}
          dynamicAtmosphereLighting={true}
          dynamicAtmosphereLightingFromSun={true}
        />
        <ImageryLayer imageryProvider={imageryProvider} />
        <ImageryLayer imageryProvider={gridImageryProvider} />
        <Clock
          startTime={now}
          currentTime={now}
          stopTime={stop}
          clockRange={Cesium.ClockRange.LOOP_STOP}
          clockStep={Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER}
          multiplier={200}
          shouldAnimate={true}
        />
        <GeoJsonDataSource
          data="/ne_110m_admin_0_countries.geojson"
          stroke={Cesium.Color.CYAN.withAlpha(0.5)}
          strokeWidth={2}
        />
      </Viewer>
    </div>
  );
};

export default GlobeViewer;