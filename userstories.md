### Refined High-Level User Stories

These user stories outline the Minimum Viable Product (MVP) for a satellite constellation simulation app, emphasizing a physics-based, animated visualization using Resium/Cesium and satellite.js for LEO circular orbits.

1.  **Core Globe Setup & UI Foundation**
    - ✅ Render a 3D Cesium globe with basic Earth imagery.
    - ✅ Add a grid overlay for visual reference.
    - ✅ Configure basic viewer settings.
    - ✅ Establish main application UI layout with a full-screen globe viewer.
    - ✅ Implement overlay panels/windows for UI sections (Top Bar, Task Schedule, Constellation/Satellite Details).
    - ✅ Make UI panels draggable and resizable for user flexibility.
    - ✅ Apply a distinct sci-fi visual theme (orange accents, blurred/transparent backgrounds) to UI panels.
    - ⏳ Add country outlines for better geographical reference (optional for initial MVP if time constrained).

2.  **MVP Satellite Configuration**
    - As a user, I can configure up to 10 satellites by specifying:
        - Altitude (300–2000 km, numeric input or slider).
        - Inclination (0–180°, numeric input or presets: 53°, 90°, 98°).
        - Right Ascension of the Ascending Node (RAAN) (0–360°, numeric or auto-calculated for even spacing).
        - True Anomaly (0–360°, numeric or auto-calculated for even spacing).
    - As a user, I can select LEO presets (e.g., 550 km/53°, 800 km/90°, 600 km/98°) to autofill altitude and inclination for all satellites.
    - As a user, I can click "Generate Demo Constellation" to load a default of 8 satellites in 2 orbital planes (4 satellites per plane), at 550 km altitude, 90° inclination, with RAANs (e.g., 0°, 180°) and true anomalies evenly spaced (e.g., 0°, 90°, 180°, 270°).

3.  **MVP Target Definition**
    - As a user, I can define up to 5 targets by:
        - Entering a city name (e.g., "Tokyo"), which is then resolved to geographic coordinates via a geocoding service (e.g., Nominatim).
        - Manually entering latitude and longitude (e.g., "35.6762° N, 139.6503° E").
        - Clicking on the Cesium globe to select a location, with optional reverse geocoding to display the nearest city/feature.
    - As a user, I can specify for each target:
        - Priority (1–5, using a dropdown menu, default: 3).
        - Minimum imaging frequency (e.g., "1 per day," "1 per week," using a dropdown, default: "1 per day").

4.  **MVP Task Scheduling**
    - As a user, I can set a simulation timespan (e.g., up to 4 weeks using a date picker or input) and a time step (default: 1 minute, configurable) for orbit propagation and task scheduling.
    - As a user, I can click a "Generate Task Schedule" button to automatically create up to 50 imaging tasks, where:
        - Each task assignment considers a satellite's simple camera with a fixed 30° field of view (FOV), determining if a target is imageable (e.g., if the target is within 15° of the satellite's nadir direction).
        - The scheduling algorithm allocates tasks to maximize imaging data by meeting the minimum imaging frequency per target, prioritizing high-priority targets, and aiming to minimize energy consumption (e.g., by selecting satellites with the smallest slew angle to the target).
        - Tasks are distributed over the specified timespan (e.g., a target with "1 per day" frequency over 4 weeks would ideally get ~28 imaging opportunities, adjusted based on the 50 total task limit and other constraints).

5.  **MVP Simulation Visualization & Control**
    - ✅ As a user, I can view satellite orbits as polylines and their current positions as distinct points, animated on the Cesium globe, with positions calculated using satellite.js for circular LEO orbit propagation. (Achieved for a single test satellite)
    - ⏳ As a user, I can see defined targets clearly marked and labeled on the Cesium globe.
    - As a user, I can view scheduled imaging tasks in a list format (e.g., displaying "Satellite Alpha: Imaging Tokyo at 2025-05-22 14:30 UTC, Slew Angle: 5°") within its designated UI panel.
    - As a user, I can observe imaging events visually on the Cesium globe, such as a temporary line connecting the satellite to the target or a flash effect on the target when its imaging task is active within the simulation.
    - As a user, I can control the simulation's playback speed (e.g., play, pause, faster, slower) using Cesium's built-in clock and timeline controls for a dynamic, LeoLabs-like experience.

---

### MVP Implementation Plan

This plan outlines the core technical tasks to deliver the MVP, focusing on user-facing features and Cesium integration as per the updated user stories.

### Tech Stack

- ✅ **Next.js (with TypeScript)**: Framework for UI and application logic.
- ✅ **Resium/CesiumJS**: For 3D globe rendering and geospatial calculations.
- ✅ **UI Styling with CSS**: Custom CSS for sci-fi theme and layout.
- ✅ **satellite.js**: For client-side LEO circular orbit propagation.
- ✅ **Nominatim (OpenStreetMap)**: For geocoding city names.

### Technical Implementation Tasks (MVP Focus)

1.  **Core Globe & UI Shell:**
    - ✅ Implement basic Cesium `Viewer` with Resium.
    - ✅ Set up main UI layout (full-screen globe, draggable/resizable overlay panels).
    - ✅ Implement placeholder panels for `TopBar`, `TaskSchedulePanel` (with internal Target Def/Task List sections), `ConstellationDetailsPanel`, `SatelliteDetailsPanel`.
    - ✅ Apply sci-fi visual theme to UI panels (borders, transparency, blur, colors, fonts).
    - ⏳ (Optional) Add country outlines to the globe.

2.  **Satellite Configuration Module (in `ConstellationDetailsPanel`):**
    - ⏳ Develop input forms for satellite orbital parameters (altitude, inclination, RAAN, true anomaly) with validation.
    - ⏳ Implement LEO preset selections.
    - ⏳ Create logic for "Generate Demo Constellation" button.
    - ⏳ Store satellite data in React state.

3.  **Target Definition Module (in `TaskSchedulePanel`):**
    - ⏳ Implement input methods for targets (city name with Nominatim, lat/lon, globe click).
    - ⏳ Add inputs for target priority and imaging frequency.
    - ⏳ Store target data in React state.

4.  **Orbit Propagation & Core Logic (satellite.js):**
    - ✅ Integrate satellite.js for propagating circular LEO orbits (ECI to ECF/Geodetic).
    - ✅ Develop functions to calculate satellite positions over the simulation timespan.

5.  **Task Scheduling Algorithm:**
    - ⏳ Implement logic to determine target visibility based on 30° FOV.
    - ⏳ Develop the scheduling algorithm to assign 50 tasks.
    - ⏳ Store task schedule in React state.

6.  **Cesium Visualization Layer:**
    - ✅ Render satellite orbits and animated positions on the globe. (Achieved for a single test satellite)
    - ⏳ Display targets as markers with labels.
    - ⏳ Implement visualization for active imaging tasks.
    - ✅ Integrate Cesium clock/timeline for simulation control.

7.  **Display & Interaction (within panels):**
    - ⏳ Create a list view for the generated task schedule in `TaskSchedulePanel`.
    - ⏳ Display satellite details in `SatelliteDetailsPanel` when a satellite is selected.
    - ⏳ Ensure responsive UI elements within the panels.

8.  **Testing & Refinement:**
    - 🟡 Test orbit propagation accuracy. (Initial visual test successful for one satellite)
    - ⏳ Validate task scheduling logic.
    - ✅ Perform usability testing on the core UI layout and panel interactions.
    - ⏳ Test functionality once implemented.

This revised plan reflects the significant UI groundwork laid in this session.
