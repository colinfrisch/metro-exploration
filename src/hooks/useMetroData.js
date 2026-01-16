import { useMemo, useCallback } from 'react';
import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';
import { latLngToSvg } from '../utils/metro';

export function useMetroData() {
  const { stations, lines } = stationsData;

  // Process stations with SVG coordinates
  const processedStations = useMemo(() => {
    const result = {};
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
  }, [stations]);

  const allStations = useMemo(() => Object.values(processedStations), [processedStations]);

  // Extract base line ID (e.g., "7-villejuif" → "7")
  const getBaseLineId = useCallback((lineId) => lineId.split('-')[0], []);

  const getLineData = useCallback((lineId) => {
    return linesData.find(l => l.id === getBaseLineId(lineId));
  }, [getBaseLineId]);

  const getLineColor = useCallback((lineId) => {
    return getLineData(lineId)?.color || '#ffffff';
  }, [getLineData]);

  const getLineStations = useCallback((lineId) => {
    const lineStationIds = lines[lineId];
    if (!lineStationIds) return [];
    return lineStationIds.map(id => processedStations[id]).filter(Boolean);
  }, [lines, processedStations]);

  const getLinesForStation = useCallback((stationId) => {
    const lineIds = [];
    Object.entries(lines).forEach(([lineId, stationIds]) => {
      if (stationIds.includes(stationId)) {
        lineIds.push(lineId);
      }
    });
    return lineIds;
  }, [lines]);

  const getNextStation = useCallback((currentStation, currentLine, direction) => {
    if (!currentStation || !currentLine) return null;
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return null;
    
    const currentIndex = lineStationIds.indexOf(currentStation.id);
    if (currentIndex === -1) return null;
    
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= lineStationIds.length) return null;
    
    return processedStations[lineStationIds[nextIndex]];
  }, [lines, processedStations]);

  const getDirectionLabels = useCallback((currentStation, currentLine) => {
    const defaultLabels = { forward: "Direction 1", backward: "Direction 2" };
    if (!currentStation || !currentLine) return defaultLabels;
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return defaultLabels;
    
    const firstName = processedStations[lineStationIds[0]]?.name || "Terminus";
    const lastName = processedStations[lineStationIds[lineStationIds.length - 1]]?.name || "Terminus";
    
    return { forward: `→ ${lastName}`, backward: `← ${firstName}` };
  }, [lines, processedStations]);

  return {
    stations,
    lines,
    processedStations,
    allStations,
    getLineData,
    getLineColor,
    getLineStations,
    getLinesForStation,
    getNextStation,
    getDirectionLabels
  };
}
