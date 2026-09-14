# 🚦 Bengaluru 3D Digital Twin & Traffic Simulator
### Realistic-but-Cinematic Digital Twin of Marathahalli Signal Junction (Outer Ring Road, Bengaluru)

A high-performance, stylized-realistic 3D digital-twin traffic simulator built with **Vite**, **React 18**, **Three.js**, **@react-three/fiber**, **@react-three/drei**, and **@react-three/postprocessing**.

Simulates **1,000–2,000 vehicles** moving at a silky **60 FPS** across Bengaluru's iconic Marathahalli flyover and crossroads junction, driven by live **TomTom Traffic Flow API** data with an intelligent **30% API Quota Safety Guard**, realistic fallback engine, dynamic traffic signal logic, and a docked dark monospace telemetry HUD.

The demo map is source-backed rather than an invented city block: the committed `marathahalli_osm.xml` extract is compiled into a local snapshot covering Oracle Tech Hub → Marathahalli signal → Innovative Multiplex → Kalamandir → Spice Garden. It is an engineering demo, not survey-grade photogrammetry; exact facade and elevation fidelity requires an authorized imagery/3D-tiles source or a field survey.

---

## 📸 Key Features

- **Iconic 3D Environment**:
  - Elevated **Marathahalli Flyover** with concrete piers, safety crash barriers, curved approach ramps, and express lanes.
  - At-grade **Outer Ring Road** (6 lanes) intersecting **Old Airport / Varthur Road** (4 lanes) with zebra crossings, yellow stop bars, median greenery, and junction box hatching.
  - Iconic covered pedestrian **Skywalk** (foot-overbridge) spanning the corridor.
  - Roadside commercial buildings, tech-park curtain-wall facades, overhead highway gantry signboards (*Bellandur, Whitefield, HAL, KR Puram*), and BMTC bus shelters.
- **Source-backed Marathahalli corridor**:
  - Local OpenStreetMap snapshot with **48,196 nodes, 9,841 clipped ways, 7,533 building footprints, 1,453 roads, 256 footways, 363 shop/restaurant POIs, 63 crossings, 20 bus stops, 41 mapped trees, 144 tagged bridge piers, 11 signals, and 21 railway/viaduct ways**.
  - Source road ribbons, footpaths, signals, crossings, shops, trees, railways, named landmarks, and four named source labels share one local metre projection.
  - Current OSM **Namma Metro Phase 2A** through-track ways are retained when they cross the clip boundary. The twin-track viaduct, moving train and regularly spaced supports are generated from that source alignment; OSM does not publish a survey of individual pier foundations, so support spacing remains explicitly modelled.
  - The 41 OSM tree nodes remain source markers; a deterministic roadside/median planting layer adds visual green coverage for the demo and is labelled as planned/modelled rather than a surveyed tree inventory.
  - The mapped ORR bend is reused by the underpass walls, portals, lane markings, traffic splines, and navigation anchors. The metro deck follows its own current OSM Phase 2A track ways rather than assuming it is the road centreline.
- **Optional photorealistic 3D provider**:
  - The `OSM 3D TWIN` control is the no-key demo path. With a Google Maps Platform key and Map Tiles API enabled, the same scene can stream Google Photorealistic 3D Tiles through [`3d-tiles-renderer`](https://github.com/NASA-AMMOS/3DTilesRendererJS), bounded to the full local Oracle → Spice Garden corridor and rendered with the provider attribution on screen.
  - Open-source alternatives worth evaluating for a larger geospatial product are [`CesiumJS`](https://github.com/CesiumGS/cesium) and [`iTowns`](https://github.com/iTowns/itowns); they are integration choices, not additional data silently bundled into this demo.
- **High-Density 60 FPS Traffic (1,000–2,000 Vehicles)**:
  - 4 specialized `THREE.InstancedMesh` systems (Cars, Bengaluru yellow/green Auto-Rickshaws, BMTC Transit Buses, and Two-Wheelers with helmeted riders).
  - Smooth 3D Catmull-Rom spline lanes (Flyover express, surface through-lanes, free-left slip roads, and turn lanes).
  - Intelligent queueing physics: vehicles detect red signals and queue realistically with Indian urban gap spacing, then accelerate smoothly on green.
  - Per-instance color variations (white/silver/blue/crimson cars, BMTC teal buses, yellow autos).
- **Live TomTom Traffic API + 30% Safety Cap**:
  - Periodic polling every 180s for coordinates `(lat 12.956840, long 77.701176)`.
  - Null-guarded extraction of `currentSpeed`, `freeFlowSpeed`, `currentTravelTime`, `confidence`, and `roadClosure`.
  - **API Quota Safety Stop**: Real-time counter tracks daily calls against TomTom's free tier. If usage reaches **30% (750 calls)**, live requests automatically pause and switch to the baked digital-twin simulation engine to protect your free quota.
  - **Zero-Crash Fallback**: Empty key, network failure, or API downtime seamlessly falls back to baked realistic Bengaluru traffic profiles.
- **Cinematic Visuals & Post-Processing**:
  - Golden-hour directional sun with soft PCFSoft shadows, HemisphereLight, ACESFilmicToneMapping, and distance fog.
  - EffectComposer pipeline with selective Bloom (signals, vehicle lamps, streetlights, window glows), N8AO ambient occlusion, and vignette.
  - **Night Mode**: Dark skies, illuminated streetlights, glowing headlights/taillights, and warm window facades.
  - **Rain Simulation**: 3,500 animated rain streak particles, wet specular asphalt reflections, and overcast atmosphere.
  - **Cinematic Auto-Orbit**: Smooth damped camera rotation with presets (*Cinematic*, *Flyover*, *Ground*, *Aerial*).
- **Docked Dark Monospace HUD**:
  - Network Health (0–100 score).
  - Junction Flow (veh/hr).
  - Average Delay per Vehicle (seconds).
  - Modeled Idling Emissions: CO₂ (kg/hr) & Fuel (L/hr) clearly labeled `[modelled estimate]`.
  - Interactive Junction Inspection modal & density slider (800 – 2,000 vehicles).

---

## 🛠️ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation & Run

1. **Clone or open the repository**:
   ```bash
   git clone <repo-url>
   cd 3dSimulator
   ```

2. **Configure TomTom API Key (Optional)**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your free TomTom key to `.env`:
   ```env
   VITE_TOMTOM_KEY=your_tomtom_api_key_here
   ```
   *(If omitted or blank, the simulator automatically runs in realistic baked DEMO mode).*

   Google Photorealistic 3D Tiles are also optional. Add `VITE_GOOGLE_MAPS_KEY` only when a Google Maps Platform project has the Map Tiles API enabled; the local OSM twin remains the default without it.

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Launch the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run preview
   ```

---

## ⚙️ Customization (Change Location or Visuals)

To twin a different intersection or adjust visuals, modify `src/config/location.ts`:

```typescript
// Customize City & Coordinates
export const ACTIVE_CITY = 'Bengaluru';
export const ACTIVE_JUNCTION_NAME = 'Marathahalli signal junction';
export const ACTIVE_COORDINATES = {
  lat: 12.956840,
  lng: 77.701176
};

// Visual Tuning Constants
export const BLOOM_INTENSITY_DAY = 0.45;
export const BLOOM_INTENSITY_NIGHT = 1.35;
export const SUN_POSITION_DAY: [number, number, number] = [90, 48, -75];
export const FOG_DENSITY_DAY = 0.0024;
```

---

## 📊 Telemetry & Safety Cap Details

- **TomTom Daily Free Limit**: 2,500 requests / day
- **30% Safety Threshold**: 750 requests / day
- **Persistence**: Call counts are saved locally in `localStorage` (`tomtom_api_usage_metrics`).
- **Reset Button**: Clicking the `Reset` button on the HUD badge clears the local count and resumes live polling.

---

## 🏗️ Project Architecture

```
src/
├── App.tsx                          # App state coordinator, TomTom polling & metric computation
├── main.tsx                         # React 18 DOM mount
├── config/
│   ├── location.ts                  # Junction coords, camera defaults, tuning constants
│   └── simulation.ts                # Vehicle distributions, speeds, emission factors, 30% cap
├── types/
│   └── index.ts                     # TypeScript interfaces for traffic, telemetry & HUD
├── services/
│   ├── tomtomService.ts             # Ephemeral fetch, null-guards, safety cap & quota tracker
│   └── demoTrafficData.ts           # Realistic Bengaluru diurnal flow profile generator
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx                # 3D Canvas, lighting, shadows, fog, environment mount
│   │   ├── CameraController.tsx     # Damped OrbitControls & cinematic auto-orbit
│   │   ├── PostProcessing.tsx       # Bloom, N8AO, Vignette, ToneMapping
│   │   ├── Environment/
│   │   │   ├── JunctionRoads.tsx    # Multi-lane asphalt, lane lines, zebra crossings, medians
│   │   │   ├── UnderpassTrench.tsx  # Source-curved ORR trench, portals, walls & lighting
│   │   │   ├── OsmSnapshotLayer.tsx # Local OSM roads, footways, buildings & POIs
│   │   │   ├── FlyoverBridge.tsx    # Marathahalli flyover deck, concrete piers, ramps
│   │   │   ├── MetroViaduct.tsx     # OSM-aligned Phase 2A twin-track deck, piers & train
│   │   │   ├── Skywalk.tsx          # Pedestrian covered footbridge over highway
│   │   │   ├── Buildings.tsx        # Commercial & tech park blocks with night window glows
│   │   │   ├── StreetFurniture.tsx  # Streetlights, 3-aspect traffic signals, overhead gantries
│   │   │   ├── Greenery.tsx         # Instanced tropical avenue trees & foliage
│   │   │   └── RainParticles.tsx    # 3,500 animated rain streak particles
│   │   └── traffic/
│   │       ├── VehicleModels.ts     # Procedural geometries for Car, Auto, Bus, Two-Wheeler
│   │       ├── TrafficSignals.tsx   # Signal phase timing state machine
│   │       ├── TrafficSystem.tsx    # Junction vehicles, spline queues & 30Hz physics
│   │       └── SourceCorridorTraffic.tsx # Source-road traffic across the widened corridor
│   └── ui/
│       ├── HUD.tsx                  # Dark monospace docked HUD container
│       ├── ControlsBar.tsx          # Night, Rain, Sim speed (1x/10x/60x), Preset toggles
│       ├── ApiUsageBadge.tsx        # TomTom quota bar & 30% safety cap indicator
│       ├── JunctionDetailModal.tsx  # Telemetry breakdown, live speeds & density slider
│       └── FallbackBanner.tsx       # Unobtrusive alert toast for safety cap or demo fallback
└── styles/
    └── index.css                    # Futuristic dark monospace glassmorphic styling
```

---

## 📜 License
MIT License
