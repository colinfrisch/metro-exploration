# Métro Roulette - Technical Specification

> A Paris metro exploration game where chance decides your destination.

## Table of Contents

1. [Overview](#overview)
2. [Technical Stack](#technical-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Game Logic](#game-logic)
6. [UI/UX Specifications](#uiux-specifications)
7. [Component Specifications](#component-specifications)
8. [Styling Guidelines](#styling-guidelines)
9. [Coordinate System](#coordinate-system)
10. [State Management](#state-management)

---

## Overview

**Métro Roulette** is a browser-based game where players explore the Paris metro network through a roulette-based mechanic. Players select a starting station, choose a line and direction, then spin a roulette wheel that determines whether they continue to the next station, change to a different line, or exit the metro.

### Core Concept
- Player selects a starting station on an interactive SVG map of the Paris metro
- Player chooses a line (if multiple are available at the station)
- Player chooses a direction (toward one terminus or the other)
- Player spins a roulette wheel with 10 slots
- The result determines the next action: continue, change line, or exit
- Game ends when player "exits" the metro

---

## Technical Stack

### Frontend Framework
- **React 19.2.0** - Modern React with hooks
- **Vite 7.2.4** - Build tool and dev server

### Key Dependencies
```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "vite": "^7.2.4"
  }
}
```

### Build Configuration
- Output directory: `docs/` (for GitHub Pages)
- Base path: `/metro-exploration/`
- Build command: `vite build && touch docs/.nojekyll`

---

## Architecture

### File Structure
```
src/
├── components/
│   ├── Game.jsx          # Main game component (639 lines)
│   ├── MetroMap.jsx      # Standalone map viewer
│   ├── Station.jsx       # Station rendering component
│   ├── Line.jsx          # Metro line rendering
│   ├── Legend.jsx        # Metro lines legend
│   └── Tooltip.jsx       # Hover tooltip for stations
├── data/
│   ├── stations.json     # Station data with coordinates
│   └── lines.json        # Metro line metadata
├── styles/
│   ├── Game.css          # Game-specific styles
│   ├── MetroMap.css      # Map viewer styles
│   ├── Station.css       # Station styles
│   ├── Line.css          # Line styles
│   ├── Legend.css        # Legend styles
│   └── Tooltip.css       # Tooltip styles
├── App.jsx               # Root application component
├── App.css               # App-level styles
├── main.jsx              # Application entry point
└── index.css             # Global styles
```

### Component Hierarchy
```
App
└── Game
    ├── SVG Map (inline)
    │   ├── Lines (polylines)
    │   └── Stations (circles)
    └── Game Panel
        ├── Message Display
        ├── Line Selection
        ├── Direction Selection
        ├── Roulette Wheel
        ├── Win Screen
        ├── History Display
        └── Reset Button
```

---

## Data Models

### Station Object
```typescript
interface Station {
  id: string;           // Unique identifier (kebab-case)
  name: string;         // Display name (French, with accents)
  lat: number;          // Latitude (GPS coordinate)
  lng: number;          // Longitude (GPS coordinate)
  lines: string[];      // Array of line IDs this station belongs to
  x?: number;           // Computed SVG X coordinate
  y?: number;           // Computed SVG Y coordinate
  isInterchange?: boolean; // Computed: true if lines.length > 1
}
```

### Line Metadata Object
```typescript
interface LineMeta {
  id: string;           // Line identifier ("1", "2", "3bis", "7-villejuif", etc.)
  name: string;         // Display name ("Ligne 1", "Ligne 3bis")
  color: string;        // Hex color code
  textColor: string;    // Text color for contrast ("#000000" or "#FFFFFF")
  terminals: string[];  // Array of terminus station names
}
```

### Lines Mapping
```typescript
interface LinesMapping {
  [lineId: string]: string[]; // Array of station IDs in order
}
```

### Special Line IDs
- Standard lines: `"1"` through `"14"`
- Branch lines: 
  - `"3bis"` - Short branch line
  - `"7bis"` - Louis Blanc to Pré Saint-Gervais
  - `"7-villejuif"` - Southern branch of Line 7
  - `"7-ivry"` - Eastern branch of Line 7
  - `"13-saint-denis"` - Northern branch of Line 13
  - `"13-courtilles"` - Northwestern branch of Line 13

---

## Game Logic

### Game States
```typescript
enum GAME_STATES {
  SELECT_STATION = 'SELECT_STATION',    // Initial state
  SELECT_LINE = 'SELECT_LINE',          // Station has multiple lines
  SELECT_DIRECTION = 'SELECT_DIRECTION', // Choose terminus direction
  PLAYING = 'PLAYING',                  // Active gameplay
  WON = 'WON'                           // Game complete
}
```

### State Transitions
```
SELECT_STATION
    │
    ├──[Station has 1 line]──→ SELECT_DIRECTION
    │
    └──[Station has >1 lines]──→ SELECT_LINE ──→ SELECT_DIRECTION
                                                        │
                                                        ↓
                                                    PLAYING
                                                        │
                                                ┌───────┴───────┐
                                                │               │
                                        [Continue/Change]   [Exit]
                                                │               │
                                                ↓               ↓
                                            PLAYING           WON
```

### Roulette Configuration

**With Correspondences (station has other lines):**
```javascript
const ROULETTE_WITH_CHANGE = [
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
];
// Probabilities: Continue 50%, Change 30%, Exit 20%
```

**Without Correspondences (no other lines at station):**
```javascript
const ROULETTE_NO_CHANGE = [
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
];
// Probabilities: Continue 80%, Exit 20%
```

### Roulette Result Handling

**Continue:**
1. Get next station in current direction
2. If next station exists:
   - Move to next station
   - Add move to history
   - Display message: "Vous avancez à [station]. Relancez la roulette !"
3. If at end of line:
   - Reverse direction
   - Display message: "Fin de ligne ! Vous faites demi-tour."
   - Add reverse action to history

**Change:**
1. Get all lines at current station except current line
2. Randomly select one of the other lines
3. Update current line
4. Display message: "Changement ! Vous prenez la [line]. Relancez la roulette !"
5. Add change action to history

**Exit:**
1. Set game state to WON
2. Display message: "🎉 Vous sortez à [station] !"
3. Add exit action to history

---

## UI/UX Specifications

### Language
- All UI text is in **French**
- Station names preserve French accents (é, è, ê, ô, etc.)

### Color Scheme (Dark Theme)
```css
--background-primary: #0d1117;
--background-secondary: #161b22;
--text-primary: #e6edf3;
--text-secondary: #8b949e;
--border-color: rgba(255, 255, 255, 0.1);
--accent-gradient: linear-gradient(135deg, #FFCD00, #CF009E, #003CA6);
```

### Metro Line Colors (Official RATP)
| Line | Color | Text |
|------|-------|------|
| 1 | #FFCD00 | #000000 |
| 2 | #003CA6 | #FFFFFF |
| 3 | #837902 | #FFFFFF |
| 3bis | #6EC4E8 | #000000 |
| 4 | #CF009E | #FFFFFF |
| 5 | #FF7E2E | #000000 |
| 6 | #6ECA97 | #000000 |
| 7 | #FA9ABA | #000000 |
| 7bis | #6ECA97 | #000000 |
| 8 | #E19BDF | #000000 |
| 9 | #B6BD00 | #000000 |
| 10 | #C9910D | #FFFFFF |
| 11 | #704B1C | #FFFFFF |
| 12 | #007852 | #FFFFFF |
| 13 | #6EC4E8 | #000000 |
| 14 | #62259D | #FFFFFF |

### Roulette Result Colors
- Continue: `#22c55e` (green)
- Change: `#3b82f6` (blue)
- Exit: `#ef4444` (red)

---

## Component Specifications

### Game.jsx (Main Component)

**State Variables:**
```javascript
const [gameState, setGameState] = useState(GAME_STATES.SELECT_STATION);
const [currentStation, setCurrentStation] = useState(null);
const [currentLine, setCurrentLine] = useState(null);
const [direction, setDirection] = useState(1);  // 1 = forward, -1 = backward
const [isSpinning, setIsSpinning] = useState(false);
const [rouletteRotation, setRouletteRotation] = useState(0);
const [selectedSlot, setSelectedSlot] = useState(null);
const [history, setHistory] = useState([]);
const [message, setMessage] = useState("Sélectionnez une station de départ");

// Zoom/Pan state
const [zoom, setZoom] = useState(1);
const [pan, setPan] = useState({ x: 0, y: 0 });
const [isPanning, setIsPanning] = useState(false);
const [panStart, setPanStart] = useState({ x: 0, y: 0 });
```

**Key Functions:**
- `latLngToSvg(lat, lng)` - Convert GPS to SVG coordinates
- `handleStationClick(station)` - Handle station selection
- `handleLineSelect(lineId)` - Handle line choice
- `handleDirectionSelect(dir)` - Handle direction choice
- `spinRoulette()` - Animate and resolve roulette
- `handleRouletteResult(result)` - Process roulette outcome
- `getNextStation()` - Calculate next station in direction
- `getDirectionLabels()` - Get terminus names for direction buttons
- `resetGame()` - Reset all state to initial

**Zoom Controls:**
- Mouse wheel: Zoom in/out (0.5x to 4x)
- Ctrl+Click drag: Pan the map
- Zoom buttons: +, -, Reset, Center on current station

### Station.jsx

**Props:**
```typescript
interface StationProps {
  station: Station;
  color: string;
  allColors?: string[];
  onHover: (station: Station | null) => void;
  isHighlighted: boolean;
}
```

**Visual Rules:**
- Regular station: Small colored circle (radius 4)
- Interchange station: White circle with colored border (radius 6)
- Highlighted: 1.5x scale with glow effect

### Tooltip.jsx

**Props:**
```typescript
interface TooltipProps {
  station: Station | null;
  lines: LineMeta[];
  position: { x: number; y: number };
  getLineColor: (lineId: string) => string;
}
```

**Behavior:**
- Follows mouse position
- Shows station name
- Shows "Correspondance" badge for interchanges
- Shows all line badges

---

## Styling Guidelines

### Layout
- Full viewport height with flexbox column layout
- Sidebar panel (350px) with game controls on right
- Main SVG map on left (flexible width)
- Responsive: Stack vertically on screens < 900px

### Animations
```css
/* Roulette spin: 3 seconds with cubic-bezier easing */
transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);

/* Station glow pulse: 1.5 second infinite */
@keyframes pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.2); }
}

/* Button hover: 0.2s ease transitions */
transition: all 0.2s ease;
```

### Border Radius Standards
- Large containers: 16px
- Medium elements (buttons, cards): 12px
- Small elements: 8px
- Mini elements: 4px

---

## Coordinate System

### Geographic Bounds (Paris Metro Area)
```javascript
const BOUNDS = {
  minLat: 48.72,
  maxLat: 48.95,
  minLng: 2.22,
  maxLng: 2.47
};
```

### SVG Dimensions
```javascript
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 850;
const PADDING = 40;
```

### Coordinate Transformation
```javascript
function latLngToSvg(lat, lng) {
  const x = PADDING + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (SVG_WIDTH - 2 * PADDING);
  const y = PADDING + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (SVG_HEIGHT - 2 * PADDING);
  return { x, y };
}
```

### Line Render Order (Back to Front)
```javascript
const lineRenderOrder = [
  '13-saint-denis', '13-courtilles', '13', '12', '14',
  '7', '7-villejuif', '7-ivry', '7bis', '5', '10', '8', 
  '6', '4', '3', '3bis', '2', '9', '11', '1'
];
```

---

## State Management

### React Hooks Used
- `useState` - All component state
- `useMemo` - Computed values (processedStations, allStations, rouletteOptions)
- `useCallback` - Memoized functions (getLineColor, getLineStations, etc.)
- `useRef` - DOM reference for map container

### History Entry Format
```typescript
interface HistoryEntry {
  station: Station;
  action: 'start' | 'move' | 'change' | 'reverse' | 'exit';
  line?: string;  // Present for 'move' and 'change' actions
}
```

### History Display Icons
- start: 🚉
- move: →
- change: 🔄
- reverse: ↩️
- exit: 🚪

---

## Deployment

### GitHub Pages Configuration
- Repository: `colinfrisch/metro-exploration`
- URL: `https://colinfrisch.github.io/metro-exploration/`
- Build output: `docs/` directory
- Required file: `docs/.nojekyll` (prevents Jekyll processing)

### Vite Configuration
```javascript
export default defineConfig({
  plugins: [react()],
  base: '/metro-exploration/',
  build: {
    outDir: 'docs'
  }
});
```

---

## Future Enhancement Considerations

### Potential Features
- Sound effects for roulette spin and results
- Multiplayer mode (race to exit)
- Statistics tracking (most visited stations, longest journey)
- Achievement system
- Share result on social media
- Dark/Light theme toggle
- Language switcher (English support)
- Real-time metro status integration

### Performance Optimizations
- Virtualize station rendering for extreme zoom levels
- Web Workers for coordinate calculations
- SVG optimization (reduce path complexity)

---

*Last updated: January 2026*
*Specification version: 1.0*
