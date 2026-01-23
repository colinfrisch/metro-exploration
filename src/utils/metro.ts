import type { CityBounds, RouletteSlot, GameState } from '../types';

// Map coordinate system - Default bounds (Paris)
// These are now configurable per city in CityContext
export const BOUNDS: CityBounds = {
  minLat: 48.72,
  maxLat: 48.95,
  minLng: 2.22,
  maxLng: 2.47
};

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 850;
export const PADDING = 40;

// Convert lat/lng to SVG coordinates (default for Paris, use hook for dynamic)
export function latLngToSvg(lat: number, lng: number, bounds: CityBounds = BOUNDS): { x: number; y: number } {
  const x = PADDING + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (SVG_WIDTH - 2 * PADDING);
  const y = PADDING + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (SVG_HEIGHT - 2 * PADDING);
  return { x, y };
}

// Create a lat/lng converter for specific city bounds
export function createLatLngToSvg(bounds: CityBounds): (lat: number, lng: number) => { x: number; y: number } {
  return function(lat: number, lng: number) {
    return latLngToSvg(lat, lng, bounds);
  };
}

// Game state machine
export const GAME_STATES: Record<GameState, GameState> = {
  SELECT_STATION: 'SELECT_STATION',
  SELECT_LINE: 'SELECT_LINE',
  SELECT_DIRECTION: 'SELECT_DIRECTION',
  PLAYING: 'PLAYING',
  CONFIRM_EXIT: 'CONFIRM_EXIT',
  WON: 'WON'
};

// Roulette slot definitions
const SLOT: Record<string, RouletteSlot> = {
  continue: { type: 'continue', label: '→', color: '#22c55e' },
  change: { type: 'change', label: '🔄', color: '#3b82f6' },
  exit: { type: 'exit', label: '🚪', color: '#ef4444' }
};

// Roulette configurations (50% continue, 30% change, 20% exit / 80% continue, 20% exit)
export const ROULETTE_WITH_CHANGE: RouletteSlot[] = [
  SLOT.continue, SLOT.change, SLOT.continue, SLOT.exit, SLOT.continue,
  SLOT.change, SLOT.continue, SLOT.change, SLOT.continue, SLOT.exit
];

export const ROULETTE_NO_CHANGE: RouletteSlot[] = [
  SLOT.continue, SLOT.continue, SLOT.continue, SLOT.continue, SLOT.exit,
  SLOT.continue, SLOT.continue, SLOT.continue, SLOT.continue, SLOT.exit
];

// Line render order (back to front)
export const LINE_RENDER_ORDER: string[] = [
  '13-saint-denis', '13-courtilles', '13', '12', '14',
  '7', '7-villejuif', '7-ivry', '7bis', '5', '10', '8', '6', '4', '3', '3bis', '2', '9', '11', '1'
];

// Place type emoji mapping
export const PLACE_TYPE_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  monument: '🏛️',
  musée: '🎨',
  parc: '🌳',
  shopping: '🛍️',
  café: '☕',
  bar: '🍸',
  autre: '📌'
};

// Journey action icons
export const JOURNEY_ICONS: Record<string, string> = {
  start: '🚉',
  move: '●',
  change: '🔄',
  reverse: '↩️',
  exit: '🚪'
};
