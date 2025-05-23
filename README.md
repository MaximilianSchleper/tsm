<div align=center>

# Satellite Constellation Manager

### A Next.js-based educational tool for satellite constellation management, orbital visualization, and coverage analysis with an interactive 3D interface.

</div>

## Features

- 🛰️ **Demo Constellation** - Generate an 8-satellite constellation with customizable orbital planes
- 🎚️ **Altitude Control** - Real-time altitude adjustment (160-2000km) for each orbital plane
- 📊 **Coverage Analysis** - Calculate and visualize global coverage percentage
- 🌍 **3D Visualization** - Interactive 3D globe with satellite orbits and coverage zones
- ⚡ **Real-time Animation** - Timeline-based visualization with 7-day simulation
- 🎯 **Interactive Selection** - Click satellites or coverage zones to view details
- 🎨 **Modern UI** - Clean, professional interface with draggable panels
- 📈 **Educational Value** - Learn how altitude affects satellite coverage
- 🌐 **Color-coded Planes** - 4 RAAN-based orbital planes with distinct colors

## Key Capabilities

### **Constellation Generation**
- **4 Orbital Planes**: RAAN 0°, 90°, 180°, 270° for global coverage
- **2 Satellites per Plane**: 8 total satellites with optimal spacing
- **Apply Changes System**: Modify altitudes and regenerate constellation
- **Realistic Orbits**: Uses accurate TLE generation and propagation

### **Coverage Analysis**
- **Visual Coverage Zones**: Color-coded coverage circles for each satellite
- **Global Coverage Calculation**: Real-time percentage calculation
- **Altitude Impact**: See how higher/lower orbits affect coverage
- **Pause-only Analysis**: Coverage shown when animation is paused

### **Interactive Features**
- **Satellite Selection**: Click any satellite to view live details
- **Coverage Zone Clicking**: Click coverage zones to select parent satellite
- **Draggable Panels**: Constellation details and satellite info panels
- **Real-time Position**: Live ECEF coordinates for selected satellites

## Tech Stack

- ⚡ **[Next.js](https://nextjs.org/)** - React Framework for Production
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-First CSS Framework
- 📦 **[TypeScript](https://www.typescriptlang.org/)** - Type Safety
- 🌍 **[Resium/CesiumJS](https://resium.darwineducation.com/)** - 3D Globe Visualization
- 🛰️ **[Satellite.js](https://github.com/shashwatak/satellite-js)** - Orbital Calculations
- 📐 **Custom Coverage Utils** - Spherical geometry for coverage analysis

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/satellite-constellation-manager.git

cd satellite-constellation-manager

# Install dependencies
bun i || pnpm i || yarn || npm i

# Start development server
bun dev || pnpm dev || yarn dev || npm run dev
```

## Usage Guide

### **1. Generate Constellation**
1. Click "Generate Demo Constellation" to create 8 satellites
2. View constellation status and configuration details
3. Watch satellites orbit in the 3D visualization

### **2. Adjust Altitudes**
1. Use the RAAN-labeled sliders to modify plane altitudes
2. See live altitude values (160km - 2000km LEO range)
3. Click "Apply Changes" to regenerate with new altitudes

### **3. Analyze Coverage**
1. Pause the animation (spacebar or UI controls)
2. Click "Show Coverage" to display coverage zones
3. View global coverage percentage in real-time
4. Click satellites or zones to see details

### **4. Interactive Exploration**
- **Satellite Selection**: Click any satellite to view live details
- **Coverage Zones**: Click colored coverage areas to select satellites
- **Panel Management**: Drag and resize information panels
- **Animation Control**: Play/pause to explore different time periods

## Educational Applications

- **Orbital Mechanics**: Understand how altitude affects orbital parameters
- **Coverage Planning**: Learn satellite constellation design principles  
- **Space Systems**: Explore real-world satellite constellation concepts
- **STEM Education**: Interactive learning for aerospace engineering concepts
