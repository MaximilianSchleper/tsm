import React from 'react';

export const metadata = {
  title: 'Satellite Constellation Manager - Simulation',
  description: 'Interactive 3D satellite constellation simulation and coverage analysis tool',
};

export default function ConstellationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Widgets/widgets.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
      {children}
    </>
  );
} 