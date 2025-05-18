"use client";

import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";
import React, { useMemo, useRef, useEffect } from 'react';

// Ensure CESIUM_BASE_URL is set on the window object for Cesium to find its assets
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = "/cesium/";
}

const GlobeViewer = () => {
  const viewerRef = useRef<any>(null);

  const imageryProvider = useMemo(() => new Cesium.SingleTileImageryProvider({
    url: "/EarthMap.jpg",
    rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
    tileWidth: 4096,
    tileHeight: 2048,
  }), []);

  // const defaultSkyBox = useMemo(() => new Cesium.SkyBox({
  //   sources: {
  //     positiveX: '/cesium/Assets/Textures/SkyBox/px.png',
  //     negativeX: '/cesium/Assets/Textures/SkyBox/nx.png',
  //     positiveY: '/cesium/Assets/Textures/SkyBox/py.png',
  //     negativeY: '/cesium/Assets/Textures/SkyBox/ny.png',
  //     positiveZ: '/cesium/Assets/Textures/SkyBox/pz.png',
  //     negativeZ: '/cesium/Assets/Textures/SkyBox/nz.png'
  //   }
  // }), []);

  // Create a dummy div for the credit container to hide default credits
  const dummyCreditContainer = typeof document !== 'undefined' ? document.createElement('div') : undefined;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (viewerRef.current && viewerRef.current.cesiumElement) {
        const canvas = viewerRef.current.cesiumElement.canvas;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        viewerRef.current.cesiumElement.cesiumWidget.resize();
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
    </Viewer>
  );
};

export default GlobeViewer; 