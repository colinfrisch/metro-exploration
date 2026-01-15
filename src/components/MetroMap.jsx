import { useState, useMemo, useEffect } from 'react';
import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';
import Line from './Line';
import Station from './Station';
import Legend from './Legend';
import Tooltip from './Tooltip';
import '../styles/MetroMap.css';

// Bounding box for Paris metro area
const BOUNDS = {
  minLat: 48.72,
  maxLat: 48.95,
  minLng: 2.22,
  maxLng: 2.47
};

// SVG dimensions
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 1000;
const PADDING = 50;

// Convert lat/lng to SVG coordinates
function latLngToSvg(lat, lng) {
  const x = PADDING + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (SVG_WIDTH - 2 * PADDING);
  const y = PADDING + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (SVG_HEIGHT - 2 * PADDING);
  return { x, y };
}

export default function MetroMap() {
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

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

  // Debug logging
  useEffect(() => {
    console.log('Total stations:', Object.keys(processedStations).length);
    const chatelet = processedStations['chatelet'];
    if (chatelet) {
      console.log('Châtelet position:', { x: chatelet.x, y: chatelet.y });
    }
    
    // Check line 1 stations
    const line1Stations = lines['1'].map(id => processedStations[id]).filter(Boolean);
    console.log('Line 1 stations count:', line1Stations.length);
    console.log('Line 1 Châtelet:', line1Stations.find(s => s.id === 'chatelet'));
  }, [processedStations, lines]);

  // Get station objects for a line
  const getLineStations = (lineId) => {
    const lineStationIds = lines[lineId];
    if (!lineStationIds) return [];
    return lineStationIds.map(id => processedStations[id]).filter(Boolean);
  };

  // Get line color by ID
  const getLineColor = (lineId) => {
    const baseLineId = lineId.split('-')[0];
    const line = linesData.find(l => l.id === baseLineId);
    return line?.color || '#ffffff';
  };

  const handleMouseMove = (e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleStationHover = (station) => {
    setHoveredStation(station);
  };

  const handleLineHover = (lineId) => {
    setHighlightedLine(lineId);
  };

  // Line render order (background to foreground)
  const lineRenderOrder = [
    '13-saint-denis', '13-courtilles', '13',
    '12', '14',
    '7', '7-villejuif', '7-ivry', '7bis',
    '5', '10', '8', '6', '4', '3', '3bis', '2', '9', '11', '1'
  ];

  // Get all unique stations for rendering
  const uniqueStations = useMemo(() => {
    return Object.values(processedStations);
  }, [processedStations]);

  return (
    <div className="metro-map" onMouseMove={handleMouseMove}>
      <header className="metro-map__header">
        <h1 className="metro-map__title">Plan du Métro de Paris</h1>
        <p className="metro-map__subtitle">Carte Interactive • {uniqueStations.length} stations</p>
      </header>

      <div className="metro-map__content">
        <div className="metro-map__svg-container">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="metro-map__svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width="100%" height="100%" fill="#0d1117" />

            {/* Render all lines FIRST */}
            <g className="metro-map__lines">
              {lineRenderOrder.map((lineId) => {
                const lineStations = getLineStations(lineId);
                if (lineStations.length < 2) return null;
                
                const color = getLineColor(lineId);
                const baseLineId = lineId.split('-')[0];
                const isHighlighted = highlightedLine === baseLineId;
                const opacity = highlightedLine && highlightedLine !== baseLineId ? 0.15 : 1;

                return (
                  <Line
                    key={lineId}
                    lineId={lineId}
                    stations={lineStations}
                    color={color}
                    isHighlighted={isHighlighted}
                    opacity={opacity}
                  />
                );
              })}
            </g>

            {/* Render all unique stations AFTER lines */}
            <g className="metro-map__stations">
              {uniqueStations.map((station) => {
                const isHovered = hoveredStation?.id === station.id;
                const isOnHighlightedLine = highlightedLine && station.lines.some(l => l === highlightedLine);
                const opacity = highlightedLine && !isOnHighlightedLine ? 0.15 : 1;
                const primaryColor = getLineColor(station.lines[0]);

                return (
                  <g key={station.id} style={{ opacity }}>
                    <Station
                      station={station}
                      color={primaryColor}
                      allColors={station.lines.map(l => getLineColor(l))}
                      onHover={handleStationHover}
                      isHighlighted={isHovered}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <Legend
          lines={linesData}
          onHoverLine={handleLineHover}
          highlightedLine={highlightedLine}
        />
      </div>

      <Tooltip
        station={hoveredStation}
        lines={linesData}
        position={mousePosition}
        getLineColor={getLineColor}
      />
    </div>
  );
}
