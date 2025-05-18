"use client";

import { Viewer, ImageryLayer } from "resium";
import * as Cesium from "cesium";

// Ensure CESIUM_BASE_URL is set on the window object for Cesium to find its assets
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = "/cesium/";
}

const GlobeViewer = () => {
  const imageryProvider = new Cesium.SingleTileImageryProvider({
    url: "/EarthMap.jpg", // Using EarthMap.jpg from public folder
    rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
    tileWidth: 2000,
    tileHeight: 1000,
  });

  // Create a dummy div for the credit container to hide default credits
  const dummyCreditContainer = typeof document !== 'undefined' ? document.createElement('div') : undefined;

  return (
    <div className="h-full w-full bg-gray-900">
      <Viewer
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        sceneModePicker={false}
        navigationHelpButton={false}
        animation={false}
        timeline={false}
        fullscreenButton={false}
        skyBox={false}
        infoBox={false}
        creditContainer={dummyCreditContainer}
      >
        <ImageryLayer imageryProvider={imageryProvider} />
      </Viewer>
    </div>
  );
};

export default GlobeViewer; 