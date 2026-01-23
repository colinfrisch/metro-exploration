// Station and Line Types
export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[];
  x: number;
  y: number;
  isInterchange: boolean;
}

export interface RawStation {
  name: string;
  lat: number;
  lng: number;
  lines: string[];
}

export interface Line {
  id: string;
  name: string;
  color: string;
  textColor: string;
  terminals: string[];
}

export interface StationsData {
  stations: Record<string, RawStation>;
  lines: Record<string, string[]>;
}

// City Types
export interface CityBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface CityText {
  selectStation: string;
  selectLine: string;
  selectDirection: string;
  spinRoulette: string;
  confirmExit: string;
  exitConfirmed: string;
  stayInMetro: string;
  advanceTo: string;
  relaunch: string;
  endOfLine: string;
  changeLine: string;
  exploreNearby: string;
  walkingDirections: string;
  searchingPlaces: string;
  direction: string;
  forward: string;
  backward: string;
}

export interface CityConfig {
  id: string;
  name: string;
  country: string;
  flag: string;
  systemName: string;
  language: 'fr' | 'en';
  bounds: CityBounds;
  text: CityText;
  placeTypes: Record<string, string>;
}

export type CityId = 'paris' | 'london' | 'singapore';

// Game Types
export type GameState = 
  | 'SELECT_STATION' 
  | 'SELECT_LINE' 
  | 'SELECT_DIRECTION' 
  | 'PLAYING' 
  | 'CONFIRM_EXIT' 
  | 'WON';

export interface RouletteSlot {
  type: 'continue' | 'change' | 'exit';
  label: string;
  color: string;
}

export type JourneyAction = 'start' | 'move' | 'change' | 'reverse' | 'exit';

export interface HistoryEntry {
  station: Station;
  action: JourneyAction;
  line?: string;
}

// Recommendations Types
export interface Place {
  name: string;
  type: string;
  description: string;
  address: string;
}

export interface Recommendations {
  places: Place[];
}

// Auth Types
export interface UserProfile {
  displayName: string;
  email: string;
  createdAt: string;
  gamesPlayed: number;
  stationsVisited: string[];
  achievements: string[];
}

// Zoom/Pan Types
export interface Point {
  x: number;
  y: number;
}

export interface ZoomPanHandlers {
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

export interface ZoomPanControls {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  centerOnStation: (station: Station | null, containerRef: React.RefObject<HTMLDivElement | null>) => void;
}
