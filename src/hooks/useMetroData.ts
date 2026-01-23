import { useMemo, useCallback, useState, useEffect } from 'react';
import { useCity } from '../contexts/CityContext';
import type { Station, RawStation, Line, StationsData, Place, CityBounds, CityId } from '../types';

// Dynamic imports for city data
const cityDataImports: Record<CityId, {
  lines: () => Promise<{ default: Line[] }>;
  stations: () => Promise<{ default: StationsData }>;
  recommendations: () => Promise<{ default: Record<string, Place[]> }>;
}> = {
  paris: {
    lines: () => import('../data/paris/lines.json') as Promise<{ default: Line[] }>,
    stations: () => import('../data/paris/stations.json') as Promise<{ default: StationsData }>,
    recommendations: () => import('../data/paris/station_recommendations.json') as Promise<{ default: Record<string, Place[]> }>
  },
  london: {
    lines: () => import('../data/london/lines.json') as Promise<{ default: Line[] }>,
    stations: () => import('../data/london/stations.json') as Promise<{ default: StationsData }>,
    recommendations: () => import('../data/london/station_recommendations.json') as Promise<{ default: Record<string, Place[]> }>
  },
  singapore: {
    lines: () => import('../data/singapore/lines.json') as Promise<{ default: Line[] }>,
    stations: () => import('../data/singapore/stations.json') as Promise<{ default: StationsData }>,
    recommendations: () => import('../data/singapore/station_recommendations.json') as Promise<{ default: Record<string, Place[]> }>
  }
};

// SVG dimensions (same for all cities)
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 850;
const PADDING = 40;

// Convert lat/lng to SVG coordinates based on city bounds
function createLatLngToSvg(bounds: CityBounds): (lat: number, lng: number) => { x: number; y: number } {
  return function latLngToSvg(lat: number, lng: number) {
    const x = PADDING + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (SVG_WIDTH - 2 * PADDING);
    const y = PADDING + ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (SVG_HEIGHT - 2 * PADDING);
    return { x, y };
  };
}

interface UseMetroDataReturn {
  stations: Record<string, RawStation>;
  lines: Record<string, string[]>;
  processedStations: Record<string, Station>;
  allStations: Station[];
  linesData: Line[];
  recommendationsData: Record<string, Place[]>;
  isLoading: boolean;
  error: string | null;
  latLngToSvg: (lat: number, lng: number) => { x: number; y: number };
  getLineData: (lineId: string) => Line | undefined;
  getLineColor: (lineId: string) => string;
  getLineStations: (lineId: string) => Station[];
  getLinesForStation: (stationId: string) => string[];
  getNextStation: (currentStation: Station | null, currentLine: string | null, direction: number) => Station | null;
  getDirectionLabels: (currentStation: Station | null, currentLine: string | null) => { forward: string; backward: string };
  getRecommendations: (stationId: string) => Place[];
}

export function useMetroData(): UseMetroDataReturn {
  const { currentCity, cityConfig } = useCity();
  
  const [stationsData, setStationsData] = useState<StationsData>({ stations: {}, lines: {} });
  const [linesData, setLinesData] = useState<Line[]>([]);
  const [recommendationsData, setRecommendationsData] = useState<Record<string, Place[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load city data when city changes
  useEffect(() => {
    async function loadCityData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const imports = cityDataImports[currentCity as CityId];
        if (!imports) {
          throw new Error(`No data available for city: ${currentCity}`);
        }

        const [stationsModule, linesModule, recommendationsModule] = await Promise.all([
          imports.stations(),
          imports.lines(),
          imports.recommendations()
        ]);

        setStationsData(stationsModule.default);
        setLinesData(linesModule.default);
        setRecommendationsData(recommendationsModule.default);
      } catch (err) {
        console.error('Failed to load city data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    loadCityData();
  }, [currentCity]);

  const { stations, lines } = stationsData;

  // Create lat/lng converter based on city bounds
  const latLngToSvg = useMemo(() => {
    return createLatLngToSvg(cityConfig.bounds);
  }, [cityConfig.bounds]);

  // Process stations with SVG coordinates
  const processedStations = useMemo(() => {
    const result: Record<string, Station> = {};
    Object.entries(stations).forEach(([id, station]) => {
      const { x, y } = latLngToSvg(station.lat, station.lng);
      result[id] = {
        ...station,
        id,
        x,
        y,
        isInterchange: station.lines.length > 1
      };
    });
    return result;
  }, [stations, latLngToSvg]);

  const allStations = useMemo(() => Object.values(processedStations), [processedStations]);

  // Extract base line ID (e.g., "7-villejuif" → "7")
  const getBaseLineId = useCallback((lineId: string) => lineId.split('-')[0], []);

  const getLineData = useCallback((lineId: string) => {
    return linesData.find(l => l.id === getBaseLineId(lineId));
  }, [getBaseLineId, linesData]);

  const getLineColor = useCallback((lineId: string) => {
    return getLineData(lineId)?.color || '#ffffff';
  }, [getLineData]);

  const getLineStations = useCallback((lineId: string) => {
    const lineStationIds = lines[lineId];
    if (!lineStationIds) return [];
    return lineStationIds.map(id => processedStations[id]).filter(Boolean);
  }, [lines, processedStations]);

  const getLinesForStation = useCallback((stationId: string) => {
    const lineIds: string[] = [];
    Object.entries(lines).forEach(([lineId, stationIds]) => {
      if (stationIds.includes(stationId)) {
        lineIds.push(lineId);
      }
    });
    return lineIds;
  }, [lines]);

  const getNextStation = useCallback((currentStation: Station | null, currentLine: string | null, direction: number) => {
    if (!currentStation || !currentLine) return null;
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return null;
    
    const currentIndex = lineStationIds.indexOf(currentStation.id);
    if (currentIndex === -1) return null;
    
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= lineStationIds.length) return null;
    
    return processedStations[lineStationIds[nextIndex]];
  }, [lines, processedStations]);

  const getDirectionLabels = useCallback((currentStation: Station | null, currentLine: string | null) => {
    const defaultLabels = { forward: cityConfig.text.forward, backward: cityConfig.text.backward };
    if (!currentStation || !currentLine) return defaultLabels;
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return defaultLabels;
    
    const firstName = processedStations[lineStationIds[0]]?.name || "Terminus";
    const lastName = processedStations[lineStationIds[lineStationIds.length - 1]]?.name || "Terminus";
    
    return { forward: `→ ${lastName}`, backward: `← ${firstName}` };
  }, [lines, processedStations, cityConfig.text]);

  const getRecommendations = useCallback((stationId: string) => {
    return recommendationsData[stationId] || [];
  }, [recommendationsData]);

  return {
    stations,
    lines,
    processedStations,
    allStations,
    linesData,
    recommendationsData,
    isLoading,
    error,
    latLngToSvg,
    getLineData,
    getLineColor,
    getLineStations,
    getLinesForStation,
    getNextStation,
    getDirectionLabels,
    getRecommendations
  };
}
