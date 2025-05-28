<div align=center>

# Satellite Constellation Manager

### A Next.js-based educational tool for satellite constellation management, orbital visualization, and coverage analysis with an immersive 3D interface.

</div>

## ✨ Experience

Start your journey with an **immersive starfield animation** that gradually accelerates like a spacecraft entering hyperspace. The cinematic landing page builds excitement before launching into the professional simulation environment.

## Features

- 🌌 **Immersive Landing Page** - Cinematic starfield animation with spacecraft acceleration effect
- 🔄 **Responsive Loading** - Professional loading indicators for seamless user experience
- 🛰️ **Demo Constellation** - Generate an 8-satellite constellation with customizable orbital planes
- 🎚️ **Altitude Control** - Real-time altitude adjustment (160-2000km) for each orbital plane
- 🔢 **Flexible Configuration** - Customize satellite count (1-60) and plane count (1-10) 
- 📊 **Coverage Analysis** - Calculate and visualize global coverage percentage
- 🌍 **3D Visualization** - Interactive 3D globe with satellite orbits and coverage zones
- ⚡ **Real-time Animation** - Timeline-based visualization with 3-day simulation
- 🎯 **Interactive Selection** - Click satellites or coverage zones to view details with selection preservation
- 🧠 **Smart Controls** - Intelligent animation/coverage toggle for optimal user experience
- 🎨 **Modern UI** - Clean, professional interface with draggable panels
- 📈 **Educational Value** - Learn how constellation parameters affect global coverage
- 🌐 **Color-coded Planes** - Dynamic RAAN-based orbital planes with distinct colors

## Key Capabilities

### **Immersive User Experience**
- **Cinematic Entry**: Starfield flythrough with 400 stars and smooth acceleration (0.5→10 speed over 3.5s)
- **Spacecraft Feel**: Cubic ease-in acceleration curve for realistic spaceflight experience
- **Professional Loading**: Animated spinner with clear feedback during simulation launch
- **Seamless Navigation**: Smooth transitions and responsive interactions throughout

### **Constellation Generation**
- **Configurable Orbital Planes**: 1-10 RAAN-based planes with dynamic color coding
- **Flexible Satellite Count**: 1-60 satellites with optimal distribution across planes
- **Apply Changes System**: Modify parameters and regenerate constellation instantly
- **Position Preservation**: Satellites maintain Earth-relative positions during orbital updates
- **Realistic Orbits**: Uses accurate TLE generation and propagation

### **Coverage Analysis**
- **Visual Coverage Zones**: Color-coded coverage circles for each satellite
- **Global Coverage Calculation**: Real-time percentage calculation
- **Parameter Impact Visualization**: See how count/altitude changes affect coverage
- **Smart Coverage UX**: Automatic animation pause when analyzing coverage

### **Interactive Features**
- **Satellite Selection**: Click any satellite to view live details
- **Selection Preservation**: Maintains selected satellite through constellation updates
- **Coverage Zone Clicking**: Click coverage zones to select parent satellite
- **Draggable Panels**: Constellation details and satellite info panels
- **Real-time Position**: Live ECEF coordinates for selected satellites

### **User Experience Enhancements**
- **Intelligent Controls**: Smart button states reflecting animation and coverage modes
- **Professional Performance**: Optimized time steps and rendering for smooth experience
- **Clean Architecture**: Maintainable code with unified color systems and shared logic
- **Production Quality**: Clean builds with no debugging artifacts

## Tech Stack

- ⚡ **[Next.js](https://nextjs.org/)** - React Framework for Production
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-First CSS Framework
- 📦 **[TypeScript](https://www.typescriptlang.org/)** - Type Safety
- 🌍 **[Resium/CesiumJS](https://resium.darwineducation.com/)** - 3D Globe Visualization
- 🛰️ **[Satellite.js](https://github.com/shashwatak/satellite-js)** - Orbital Calculations
- 📐 **Custom Coverage Utils** - Spherical geometry for coverage analysis
- 🌌 **HTML5 Canvas** - Starfield animation with 3D perspective projection

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

### **1. Landing Experience**
1. **Immersive Entry**: Experience the starfield animation as it gradually accelerates like a spacecraft
2. **Launch Simulation**: Click the button and watch the loading animation before entering the tool
3. **Professional Transition**: Smooth navigation to the constellation management interface

### **2. Generate Constellation**
1. Click "Generate Default Constellation" to create a demo constellation
2. View constellation status and configuration details
3. Watch satellites orbit in the 3D visualization

### **3. Customize Parameters**
1. **Satellite Count**: Adjust total satellites (1-60) via input field
2. **Plane Count**: Set number of orbital planes (1-10) via input field
3. **Altitude Control**: Use RAAN-labeled sliders to modify plane altitudes (160-2000km)
4. **Apply Changes**: Click to regenerate constellation with new parameters
5. **Selection Preservation**: Your selected satellite will remain selected after updates

### **4. Analyze Coverage**
1. **Smart Coverage Toggle**: Click "Analyze Coverage" to auto-pause and show coverage zones
2. **Resume Animation**: Click "Resume Animation" to hide zones and continue simulation
3. **Global Coverage**: View real-time coverage percentage in the panel header
4. **Interactive Zones**: Click colored coverage areas to select satellites

### **5. Interactive Exploration**
- **Satellite Selection**: Click any satellite to view live details and coordinates
- **Coverage Zones**: Click colored coverage areas to select satellites
- **Panel Management**: Drag and resize information panels as needed
- **Animation Control**: Use smart toggles or timeline controls for time navigation

## Educational Applications

- **Orbital Mechanics**: Understand how altitude affects orbital parameters and coverage
- **Constellation Design**: Learn how satellite count and plane configuration impact global coverage
- **Space Systems Engineering**: Explore real-world satellite constellation concepts
- **STEM Education**: Interactive learning for aerospace engineering and orbital dynamics
- **Coverage Optimization**: Experiment with different configurations to maximize coverage
- **Professional Presentation**: Demonstrate concepts with cinematic, engaging interface

## Recent Improvements ✨

### **Critical Bug Fixes (Latest)**
- ✅ **Fixed Coverage Zone Auto-Hide**: External animation resume (via Cesium clock) now properly hides coverage zones for consistent behavior
- ✅ **Fixed Apply Changes Data Freshness**: Coverage zones now use fresh constellation data instead of stale state when applying parameter changes  
- ✅ **Fixed Panel State Persistence**: TopBar panel toggles now preserve all state (coverage zones, constellation data, panel position/size) instead of resetting

### **Landing Page Experience**
- ✅ **Immersive Starfield**: 400-star flythrough with 3D perspective projection and smooth acceleration
- ✅ **Spacecraft Animation**: Gradual speed buildup (3.5s) for realistic spaceflight feel
- ✅ **Professional Loading**: Responsive spinner animation with clear state feedback
- ✅ **Cinematic Design**: Amber/orange color scheme with smooth transitions and hover effects

### **Enhanced Functionality**
- ✅ **Improved Apply Changes**: Now properly respects all user input parameters
- ✅ **Selection Preservation**: Selected satellites remain selected through constellation updates  
- ✅ **Position-Preserving Updates**: Satellites maintain Earth-relative positions during orbital changes
- ✅ **Smart Coverage UX**: Intelligent animation/coverage toggle for optimal workflow

### **Code Quality & Performance**
- ✅ **Major Refactoring**: Eliminated 300+ lines of duplicate code for better maintainability
- ✅ **Unified Architecture**: Shared constellation generation logic with clean separation of concerns
- ✅ **Consistent Color System**: Unified color generation across UI and 3D rendering
- ✅ **Professional Constants**: Clean, maintainable constants replacing magic numbers
- ✅ **Production Ready**: Clean builds with no console logs or debugging artifacts

### **User Experience**
- ✅ **Enhanced Button Logic**: Clear, intuitive button states for all operation modes
- ✅ **Fixed Coverage Zones**: Improved visibility and persistence of coverage visualization
- ✅ **Dynamic Performance**: Optimized time steps based on constellation size
- ✅ **Professional Polish**: Smooth, responsive interface with intelligent state management
- ✅ **Immersive Entry Point**: Cinematic landing page that builds excitement for exploration
