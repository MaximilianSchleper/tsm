<div align=center>

# Satellite Constellation Manager

### A Next.js-based tool for managing satellite constellations, visualizing orbits, and optimizing imaging task scheduling with a sci-fi inspired interface.

</div>

## Features

- 🛰️ **Satellite Management** - Input and manage up to 10 satellites using Two-Line Elements (TLEs)
- 📋 **Task Scheduling** - Define up to 50 imaging tasks with locations and time windows
- 🎯 **Optimization** - Generate efficient schedules for satellite imaging tasks
- 🌍 **3D Visualization** - Interactive 3D globe with satellite orbits and task locations
- ⚡ **Real-time Animation** - Timeline-based visualization of satellite movements and task activations
    - Test satellite (ISS TLE) orbit propagation and animation.
- 🎨 **Sci-fi Interface** - Dark theme with neon accents inspired by The Expanse
- 📊 **Interactive Features** - Track satellites, view details, and explore the constellation
- 🛰️ **Interactive Selection**: Click on a satellite in the 3D view to display its live details.

## Tech Stack

- ⚡ **[Next.js](https://nextjs.org/)** - React Framework for Production
- 🔥 **[App Router](https://nextjs.org/docs/app)** - Latest Next.js features
- 🎨 **[Tailwind CSS](https://tailwindcss.com/)** - Utility-First CSS Framework
- 📦 **[TypeScript](https://www.typescriptlang.org/)** - Type Safety
- 🌍 **[Resium/CesiumJS](https://resium.darwineducation.com/)** - 3D Globe Visualization
- 🛰️ **[Satellite.js](https://github.com/shashwatak/satellite-js)** - Orbital Calculations
- 📝 **[ESLint](https://eslint.org/)** - Code Quality
- 🛠 **[Prettier](https://prettier.io/)** - Code Formatting
- 🐶 **[Husky](https://typicode.github.io/husky/#/)** - Git Hooks
- 🚫 **[lint-staged](https://github.com/okonet/lint-staged)** - Staged File Linting
- 📄 **[commitlint](https://commitlint.js.org/#/)** - Commit Message Linting

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

## Core Functionality

1. **Satellite Management**
   - Add satellites using TLE data
   - View satellite list with orbit details
   - Edit or remove satellites

2. **Task Scheduling**
   - Define imaging tasks with coordinates
   - Set time windows and priorities
   - Generate optimized schedules

3. **3D Visualization**
   - Interactive globe with country outlines
   - Glowing satellite orbits
   - Task location markers
   - Timeline-based animation

4. **Demo Mode**
   - Preloaded sample constellation
   - Example imaging tasks
   - One-click visualization

## Available Scripts

| **Script**   | **Description**                                      |
| ------------ | ---------------------------------------------------- |
| `dev`        | Runs the app in development mode                     |
| `build`      | Builds the app for production                        |
| `start`      | Runs the built app in production mode                |
| `preview`    | Builds and serves the app in production mode         |
| `lint`       | Runs ESLint on the project                           |
| `type-check` | Runs TypeScript type checker                         |
| `fmt`        | Formats code with Prettier                           |
| `fmt:check`  | Checks code formatting with Prettier                 |

## After Installation Checklist

- [ ] Update `package.json` with your project details
- [ ] Update `README.md` with your project details
- [ ] Update `LICENSE` with your name and year
