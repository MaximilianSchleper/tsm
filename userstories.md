### Refined High-Level User Stories

These user stories reflect the simplified globe requirement while emphasizing the dynamic, LeoLabs-inspired visualization with a sci-fi aesthetic.

1. **Set Up Constellation As a satellite operator**, I want to input my satellites' orbital data so that I can see them on a 3D globe with basic country outlines.
   - Add up to 10 satellites using Two-Line Elements (TLEs).
   - View a list of satellites with names and basic orbit details.
2. **Input Goals (Define Imaging Tasks)As a satellite operator**, I want to specify imaging tasks with locations and time windows so that the software can schedule them.
   - Add up to 50 tasks with latitude, longitude, time windows (e.g., start/end times in UTC), and optional priority.
   - See a task list with edit/delete options.
3. **Run Optimization (Generate Schedule) As a satellite operator**, I want a schedule that assigns tasks to satellites so that I can plan operations efficiently.
   - Generate a schedule using a simple algorithm (e.g., assign tasks to the first available satellite with visibility).
   - Display the schedule as a list with satellite, task, and time.
4. **Visualize Results As a satellite operator**, I want an interactive 3D visualization of a simplified Earth globe with country outlines, showing satellite orbits and tasks, inspired by LeoLabs, so that I can explore the schedule dynamically with a sci-fi flair.
   - Display a 3D globe with basic country outlines (no high-res imagery), zoomable and rotatable.
   - Show satellite orbits as glowing, curved paths around Earth (e.g., neon blue or purple lines).
   - Mark task locations with glowing pins or zones on the globe.
   - Include a timeline with play/pause controls to animate satellite movements and task activations (e.g., a pulse or beam effect when imaging occurs).
   - Allow clicking a satellite to show a popup with details (name, current position, assigned tasks).
   - Enable a "track" mode to lock the camera on a selected satellite's movement.
   - Use a dark, sci-fi-themed UI with neon accents for a futuristic, *The Expanse*like aesthetic.
5. **Demo Mode As a potential user**, I want a one-click demo with preloaded data to instantly see the tool's value.
   - Load a sample constellation (e.g., 3 satellites) and tasks (e.g., 5 imaging targets).
   - Auto-generate and visualize the schedule on the 3D globe with animation.

---

### Refined Implementation Plan

This plan eliminates the Cesium Ion token by using a self-hosted or procedural globe while enhancing the visualization to capture LeoLabs' interactivity and your sci-fi vision. It's broken into small, manageable tasks for a developer, running client-side with Next.js, Resium, satellite.js, and Tailwind CSS for easy Vercel deployment.

### Tech Stack

- **Next.js (with TypeScript)**: Framework for UI and logic, ensuring a fast, deployable app.
- **Resium/CesiumJS**: 3D globe rendering, using a simplified imagery layer (no Cesium Ion).
- **Satellite.js**: Client-side orbital calculations from TLEs for satellite positions and visibility.
- **Tailwind CSS**: Styling for a dark, neon, sci-fi UI.
- **Natural Earth (Optional)**: Static imagery for basic country outlines, bundled with the app.

### Technical Implementation Tasks

1. ✅ **Initialize Next.js Project**
   - **Description**: Set up a Next.js app with TypeScript and install dependencies.
   - **Tasks**:
     - ✅ Run npx create-next-app@latest --ts to create the project.
     - ✅ Install resium, cesium, satellite.js, and tailwindcss.
     - ✅ Configure CesiumJS for static builds (no Ion token) by disabling default assets.
   - **Deliverables**: A configured Next.js project ready for development.

2. ✅ **Set Up Simplified 3D Globe**
   - **Description**: Render a 3D globe with basic country outlines without Cesium Ion.
   - **Tasks**:
     - ✅ Create a GlobeViewer component with Resium's Viewer.
     - ✅ Use a static imagery layer (e.g., Natural Earth's 1:110m world map PNG) as the base layer, served from the public folder.
     - ✅ Alternatively, apply a procedural globe (e.g., Cesium's EllipsoidImageryProvider with a solid color and grid for land/ocean).
     - ✅ Enable zoom, pan, and rotate controls.
     - ✅ Apply a dark Tailwind background (bg-gray-900).
   - **Deliverables**: A 3D globe showing Earth with country outlines, no token required.

3. 🔄 **Create Constellation Input Form** (In Progress)
   - **Description**: Build a form to input satellite TLEs and names.
   - **Tasks**:
     - 🔄 Design a form with fields: name, TLE Line 1, TLE Line 2.
     - 🔄 Validate TLE format using satellite.js's twoline2satrec.
     - 🔄 Store up to 10 satellites in React state (e.g., { name, tle1, tle2 }).
     - 🔄 Display a list with edit/delete buttons, styled with Tailwind (e.g., neon blue borders).
   - **Deliverables**: A styled form and list component.

4. ⏳ **Calculate Satellite Positions with Satellite.js**
   - **Description**: Use satellite.js to compute satellite positions for orbits and visibility checks.
   - **Tasks**:
     - Write a utility function to parse TLEs and calculate geodetic positions (lat, lon, alt) every 5 minutes for 24 hours using satellite.propagate and eciToGeodetic.
     - Create a function to check visibility (elevation >10°) for a target location within a time window, using satellite.lookAngles.
     - Cache results in state to avoid repeated calculations.
   - **Deliverables**: Functions returning position arrays (e.g., [{ lat, lon, alt, time }]) and visibility windows.

5. ⏳ **Render Satellite Orbits**
   - **Description**: Display satellite orbits as glowing paths on the globe.
   - **Tasks**:
     - Use Cesium's Entity with a Path to draw orbits from position data.
     - Apply a neon glow effect (e.g., Material.fromType('Color', { color: Cesium.Color.BLUE, alpha: 0.7 })).
     - Add a billboard or small 3D model (e.g., a cube) for each satellite's current position, updated via Cesium's SampledPositionProperty.
   - **Deliverables**: Animated, glowing satellite paths with moving markers.

6. ⏳ **Create Task Input Form**
   - **Description**: Build a form for imaging tasks.
   - **Tasks**:
     - Design a form with fields: latitude, longitude, start time (UTC), end time, priority (1–5, optional).
     - Validate inputs (e.g., -90 ≤ lat ≤ 90, valid ISO dates).
     - Store up to 50 tasks in state (e.g., { lat, lon, start, end, priority }).
     - Show a task list with edit/delete, styled with Tailwind.
   - **Deliverables**: A styled task form and list component.

7. ⏳ **Implement Scheduling Algorithm**
   - **Description**: Assign tasks to satellites based on visibility.
   - **Tasks**:
     - Write a greedy algorithm: for each task, select the first satellite with a visibility window in the task's time range, ensuring no overlapping assignments.
     - Sort tasks by priority (if provided) to prioritize high-value tasks.
     - Store the schedule (e.g., [{ satellite, task, time }]) in state.
   - **Deliverables**: A function generating a conflict-free schedule.

8. ⏳ **Display Schedule**
   - **Description**: Show the schedule in a list format.
   - **Tasks**:
     - Create a table component with columns: satellite name, task location, scheduled time.
     - Style with Tailwind (e.g., text-cyan-300 for text, dark rows).
     - Allow sorting by time or satellite.
   - **Deliverables**: A responsive, sci-fi-styled schedule table.

9. ⏳ **Visualize Tasks on Globe**
   - **Description**: Mark task locations and show activations during the simulation.
   - **Tasks**:
     - Add Entity markers for task locations (e.g., glowing pins with BillboardGraphics, using a neon PNG icon).
     - Create a dynamic effect for task activation (e.g., a pulsing circle or beam from satellite to task, using CallbackProperty to toggle visibility at the scheduled time).
     - Link tasks to satellites visually (e.g., a line during imaging).
   - **Deliverables**: Task markers with animated, sci-fi effects.

10. ⏳ **Add Timeline and Animation**
    - **Description**: Enable playback of satellite movements and tasks.
    - **Tasks**:
      - Configure Cesium's Clock with a 24-hour range and Timeline widget.
      - Add play/pause buttons and a slider, styled with Tailwind (e.g., neon slider).
      - Use SampledPositionProperty to animate satellites along their paths, synced with the clock.
      - Trigger task effects (e.g., pulses) at scheduled times.
    - **Deliverables**: A timeline UI with smooth, synchronized animation.

11. ⏳ **Enable Satellite Interaction**
    - **Description**: Allow clicking satellites for details and camera tracking.
    - **Tasks**:
      - Add onClick handlers to satellite entities using Cesium's ScreenSpaceEventHandler.
      - Show a popup (React component) with details: name, current lat/lon/alt (from satellite.js), and assigned tasks.
      - Add a "Track" button to set viewer.trackedEntity, locking the camera to the satellite.
      - Style popups with Tailwind (e.g., bg-gray-800, neon borders).
    - **Deliverables**: Interactive satellite details and camera tracking.

12. ⏳ **Enhance Sci-Fi Aesthetics**
    - **Description**: Apply a *The Expanse*inspired visual style.
    - **Tasks**:
      - Use Tailwind for a dark UI (bg-gray-900) with neon accents (e.g., border-cyan-500, text-purple-400).
      - Customize Cesium materials for orbits (e.g., glowing blue with MaterialProperty) and task markers (e.g., pulsing neon pins).
      - Add a subtle starry background using Cesium's SkyBox with a custom texture.
      - Optionally, use Cesium's ParticleSystem for minor effects (e.g., faint trail behind satellites).
    - **Deliverables**: A visually striking, sci-fi-themed interface.

13. ⏳ **Implement Demo Mode**
    - **Description**: Provide a preloaded demo for instant testing.
    - **Tasks**:
      - Hardcode 3 sample satellites (e.g., ISS, two CubeSats) and 5 tasks (e.g., imaging major cities).
      - Add a "Run Demo" button to load data, generate a schedule, and start the visualization.
      - Auto-play the timeline with a 10x speed multiplier.
    - **Deliverables**: A one-click demo experience.

14. ⏳ **Handle Errors and Edge Cases**
    - **Description**: Ensure robustness for invalid inputs or unschedulable tasks.
    - **Tasks**:
      - Validate TLEs (check format via satellite.js), coordinates (-90 ≤ lat ≤ 90, -180 ≤ lon ≤ 180), and times (future dates).
      - Show Tailwind-styled error messages (e.g., text-red-500).
      - Notify users if tasks can't be scheduled (e.g., "No satellite visibility").
      - Test with edge cases (e.g., max 10 satellites, 50 tasks, empty inputs).
    - **Deliverables**: User-friendly error handling.

15. ⏳ **Deploy to Vercel**
    - **Description**: Deploy the app for public access.
    - **Tasks**:
      - Create a GitHub repository and push the code.
      - Connect to Vercel, configure for Next.js, and set CESIUM_BASE_URL for static Cesium assets.
      - Bundle imagery (e.g., Natural Earth PNG) in the public folder.
      - Test the live app to ensure orbits, tasks, and animations work.
    - **Deliverables**: A live URL (e.g., your-mvp.vercel.app).
