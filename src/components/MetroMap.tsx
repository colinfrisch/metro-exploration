import { forwardRef, memo, useMemo } from 'react';
import { SVG_WIDTH, SVG_HEIGHT, LINE_RENDER_ORDER, GAME_STATES, createLatLngToSvg } from '../utils/metro';
import { useCity } from '../contexts/CityContext';
import ZoomControls from './ZoomControls';
import type { Station, GameState, ZoomPanHandlers, ZoomPanControls } from '../types';
import '../styles/MetroMap.css';

type LatLngToSvg = (lat: number, lng: number) => { x: number; y: number };

interface CityBackground {
  outline: string | null;
  river: string | null;
}

// City background generators
function generateParisBackground(toSvg: LatLngToSvg): CityBackground {
  const outline = `
    M ${toSvg(48.902, 2.28).x} ${toSvg(48.902, 2.28).y}
    C ${toSvg(48.91, 2.32).x} ${toSvg(48.91, 2.32).y}
      ${toSvg(48.905, 2.38).x} ${toSvg(48.905, 2.38).y}
      ${toSvg(48.895, 2.41).x} ${toSvg(48.895, 2.41).y}
    C ${toSvg(48.88, 2.42).x} ${toSvg(48.88, 2.42).y}
      ${toSvg(48.86, 2.42).x} ${toSvg(48.86, 2.42).y}
      ${toSvg(48.84, 2.415).x} ${toSvg(48.84, 2.415).y}
    C ${toSvg(48.825, 2.40).x} ${toSvg(48.825, 2.40).y}
      ${toSvg(48.815, 2.38).x} ${toSvg(48.815, 2.38).y}
      ${toSvg(48.815, 2.35).x} ${toSvg(48.815, 2.35).y}
    C ${toSvg(48.815, 2.32).x} ${toSvg(48.815, 2.32).y}
      ${toSvg(48.82, 2.28).x} ${toSvg(48.82, 2.28).y}
      ${toSvg(48.83, 2.25).x} ${toSvg(48.83, 2.25).y}
    C ${toSvg(48.845, 2.235).x} ${toSvg(48.845, 2.235).y}
      ${toSvg(48.86, 2.23).x} ${toSvg(48.86, 2.23).y}
      ${toSvg(48.875, 2.24).x} ${toSvg(48.875, 2.24).y}
    C ${toSvg(48.89, 2.25).x} ${toSvg(48.89, 2.25).y}
      ${toSvg(48.90, 2.27).x} ${toSvg(48.90, 2.27).y}
      ${toSvg(48.902, 2.28).x} ${toSvg(48.902, 2.28).y}
    Z
  `;
  const river = `
    M ${toSvg(48.84, 2.23).x} ${toSvg(48.84, 2.23).y}
    Q ${toSvg(48.855, 2.28).x} ${toSvg(48.855, 2.28).y}
      ${toSvg(48.865, 2.32).x} ${toSvg(48.865, 2.32).y}
    Q ${toSvg(48.855, 2.35).x} ${toSvg(48.855, 2.35).y}
      ${toSvg(48.845, 2.38).x} ${toSvg(48.845, 2.38).y}
    Q ${toSvg(48.84, 2.40).x} ${toSvg(48.84, 2.40).y}
      ${toSvg(48.835, 2.42).x} ${toSvg(48.835, 2.42).y}
  `;
  return { outline, river };
}

function generateLondonBackground(toSvg: LatLngToSvg): CityBackground {
  const river = `
    M ${toSvg(51.47, -0.30).x} ${toSvg(51.47, -0.30).y}
    Q ${toSvg(51.48, -0.22).x} ${toSvg(51.48, -0.22).y}
      ${toSvg(51.50, -0.12).x} ${toSvg(51.50, -0.12).y}
    Q ${toSvg(51.51, -0.08).x} ${toSvg(51.51, -0.08).y}
      ${toSvg(51.50, 0.00).x} ${toSvg(51.50, 0.00).y}
    Q ${toSvg(51.49, 0.05).x} ${toSvg(51.49, 0.05).y}
      ${toSvg(51.48, 0.10).x} ${toSvg(51.48, 0.10).y}
  `;
  return { outline: null, river };
}

function generateSingaporeBackground(toSvg: LatLngToSvg): CityBackground {
  const coastline = `
    M ${toSvg(1.26, 103.62).x} ${toSvg(1.26, 103.62).y}
    Q ${toSvg(1.265, 103.70).x} ${toSvg(1.265, 103.70).y}
      ${toSvg(1.27, 103.78).x} ${toSvg(1.27, 103.78).y}
    Q ${toSvg(1.265, 103.85).x} ${toSvg(1.265, 103.85).y}
      ${toSvg(1.28, 103.88).x} ${toSvg(1.28, 103.88).y}
    Q ${toSvg(1.29, 103.92).x} ${toSvg(1.29, 103.92).y}
      ${toSvg(1.32, 103.98).x} ${toSvg(1.32, 103.98).y}
  `;
  const river = `
    M ${toSvg(1.29, 103.84).x} ${toSvg(1.29, 103.84).y}
    Q ${toSvg(1.288, 103.845).x} ${toSvg(1.288, 103.845).y}
      ${toSvg(1.285, 103.85).x} ${toSvg(1.285, 103.85).y}
    Q ${toSvg(1.283, 103.853).x} ${toSvg(1.283, 103.853).y}
      ${toSvg(1.28, 103.855).x} ${toSvg(1.28, 103.855).y}
  `;
  return { outline: coastline, river };
}

const CITY_BACKGROUNDS: Record<string, (toSvg: LatLngToSvg) => CityBackground> = {
  paris: generateParisBackground,
  london: generateLondonBackground,
  singapore: generateSingaporeBackground
};

// Memoized Line component
interface MetroLineProps {
  lineId: string;
  stations: Station[];
  color: string;
  isHighlighted: boolean;
  opacity: number;
  isSelecting: boolean;
  onHover: (lineId: string | null) => void;
}

const MetroLine = memo(function MetroLine({ 
  lineId, stations, color, isHighlighted, opacity, isSelecting, onHover 
}: MetroLineProps) {
  if (stations.length < 2) return null;
  const points = stations.map(s => `${s.x},${s.y}`).join(' ');

  return (
    <polyline
      points={points}
      stroke={color}
      strokeWidth={isHighlighted ? 4 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={opacity}
      style={{ cursor: isSelecting ? 'pointer' : 'default', pointerEvents: isSelecting ? 'stroke' : 'none' }}
      onMouseEnter={() => isSelecting && onHover(lineId)}
      onMouseLeave={() => isSelecting && onHover(null)}
    />
  );
});

// Memoized Station component
interface MetroStationProps {
  station: Station;
  color: string;
  currentLineColor: string;
  isCurrentStation: boolean;
  isHovered: boolean;
  shouldDim: boolean;
  canSelect: boolean;
  onClick: (station: Station) => void;
  onHover: (station: Station | null) => void;
}

const MetroStation = memo(function MetroStation({
  station, color, currentLineColor, isCurrentStation, isHovered, shouldDim, 
  canSelect, onClick, onHover
}: MetroStationProps) {
  const radius = station.isInterchange ? 5 : 3;
  const hitAreaRadius = 12;

  return (
    <g 
      opacity={shouldDim ? 0.15 : 1}
      style={{ cursor: canSelect ? 'pointer' : 'default' }}
    >
      {isCurrentStation && (
        <>
          <circle cx={station.x} cy={station.y} r={25} fill={currentLineColor} className="metro-map__station-glow-outer" />
          <circle cx={station.x} cy={station.y} r={15} fill={currentLineColor} className="metro-map__station-glow" />
        </>
      )}
      
      <circle
        cx={station.x}
        cy={station.y}
        r={isCurrentStation ? 8 : (isHovered ? radius + 2 : radius)}
        fill={station.isInterchange ? '#ffffff' : color}
        stroke={station.isInterchange ? color : '#0d1117'}
        strokeWidth={station.isInterchange ? 2 : 1}
        className={`metro-map__station ${canSelect ? 'metro-map__station--selectable' : ''}`}
        style={{ pointerEvents: 'none' }}
      />
      
      <circle
        cx={station.x}
        cy={station.y}
        r={hitAreaRadius}
        fill="transparent"
        stroke="none"
        style={{ pointerEvents: canSelect ? 'auto' : 'none', cursor: canSelect ? 'pointer' : 'default' }}
        onMouseEnter={() => onHover(station)}
        onMouseLeave={() => onHover(null)}
        onClick={() => canSelect && onClick(station)}
      />
      
      {isCurrentStation && !isHovered && (
        <text x={station.x} y={station.y - 15} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" className="metro-map__station-label">
          {station.name}
        </text>
      )}
    </g>
  );
});

interface MetroMapProps {
  gameState: GameState;
  allStations: Station[];
  lines: Record<string, string[]>;
  currentStation: Station | null;
  currentLine: string | null;
  hoveredStation: Station | null;
  hoveredLine: string | null;
  canSelectStation: boolean;
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  zoomHandlers: ZoomPanHandlers;
  zoomControls: ZoomPanControls;
  getLineColor: (lineId: string) => string;
  getLineStations: (lineId: string) => Station[];
  onStationClick: (station: Station) => void;
  onStationHover: (station: Station | null) => void;
  onLineHover: (lineId: string | null) => void;
}

const MetroMap = forwardRef<HTMLDivElement, MetroMapProps>(function MetroMap({
  gameState,
  allStations,
  lines,
  currentStation,
  currentLine,
  hoveredStation,
  hoveredLine,
  canSelectStation,
  zoom,
  pan,
  isPanning,
  zoomHandlers,
  zoomControls,
  getLineColor,
  getLineStations,
  onStationClick,
  onStationHover,
  onLineHover
}, ref) {
  const { currentCity, cityConfig } = useCity();
  const isSelectingStation = gameState === GAME_STATES.SELECT_STATION;

  const cityBackground = useMemo(() => {
    const toSvg = createLatLngToSvg(cityConfig.bounds);
    const generator = CITY_BACKGROUNDS[currentCity];
    return generator ? generator(toSvg) : { outline: null, river: null };
  }, [currentCity, cityConfig.bounds]);

  const lineRenderOrder = useMemo(() => {
    if (currentCity === 'paris') {
      return LINE_RENDER_ORDER.filter(lineId => lines[lineId]);
    }
    return Object.keys(lines);
  }, [currentCity, lines]);

  const getLineProps = useMemo(() => (lineId: string) => {
    const lineStations = getLineStations(lineId);
    if (lineStations.length < 2) return null;
    
    const color = getLineColor(lineId);
    const isCurrentLine = currentLine === lineId;
    const isHoveredLine = hoveredLine === lineId;
    const lineStationIds = lines[lineId] || [];
    const containsHoveredStation = hoveredStation && lineStationIds.includes(hoveredStation.id);
    
    let opacity = 0.8;
    let isHighlighted = isCurrentLine || isHoveredLine;
    
    if (currentLine) {
      opacity = isCurrentLine ? 0.9 : 0.15;
    } else if (isSelectingStation && hoveredStation) {
      opacity = containsHoveredStation ? 1 : 0.15;
      isHighlighted = !!containsHoveredStation;
    } else if (isSelectingStation && hoveredLine) {
      opacity = isHoveredLine ? 1 : 0.15;
    }
    
    return { stations: lineStations, color, isHighlighted, opacity };
  }, [currentLine, hoveredLine, hoveredStation, isSelectingStation, getLineStations, getLineColor, lines]);

  const getStationDimmed = useMemo(() => (station: Station) => {
    const currentLineStations = currentLine ? lines[currentLine] || [] : [];
    const hoveredLineStations = hoveredLine ? lines[hoveredLine] || [] : [];
    const isOnCurrentLine = currentLineStations.includes(station.id);
    const isOnHoveredLine = hoveredLineStations.includes(station.id);
    const isCurrentStationId = currentStation?.id === station.id;
    const isHovered = hoveredStation?.id === station.id;
    const sharesLineWithHovered = hoveredStation && station.lines.some(l => hoveredStation.lines.includes(l));

    if (currentLine) return !isOnCurrentLine && !isCurrentStationId;
    if (isSelectingStation && hoveredStation) return !sharesLineWithHovered && !isHovered;
    if (isSelectingStation && hoveredLine) return !isOnHoveredLine;
    return false;
  }, [currentLine, hoveredLine, hoveredStation, currentStation, isSelectingStation, lines]);

  return (
    <div className="metro-map" ref={ref} {...zoomHandlers}>
      <ZoomControls
        zoom={zoom}
        onZoomIn={zoomControls.zoomIn}
        onZoomOut={zoomControls.zoomOut}
        onReset={zoomControls.resetZoom}
        onCenter={() => zoomControls.centerOnStation(currentStation, ref as React.RefObject<HTMLDivElement | null>)}
        showCenter={!!currentStation}
      />
      
      <svg 
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
        className="metro-map__svg"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
          cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : 'default')
        }}
      >
        <rect width="100%" height="100%" fill="#0d1117" />
        {cityBackground.outline && (
          <path d={cityBackground.outline} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" />
        )}
        {cityBackground.river && (
          <path d={cityBackground.river} fill="none" stroke="rgba(100, 150, 200, 0.12)" strokeWidth="8" strokeLinecap="round" />
        )}
        
        <g className="metro-map__lines">
          {lineRenderOrder.map(lineId => {
            const props = getLineProps(lineId);
            if (!props) return null;
            return (
              <MetroLine
                key={lineId}
                lineId={lineId}
                {...props}
                isSelecting={isSelectingStation}
                onHover={onLineHover}
              />
            );
          })}
        </g>
        
        <g className="metro-map__stations">
          {allStations.map(station => (
            <MetroStation
              key={station.id}
              station={station}
              color={getLineColor(station.lines[0])}
              currentLineColor={getLineColor(currentLine || station.lines[0])}
              isCurrentStation={currentStation?.id === station.id}
              isHovered={hoveredStation?.id === station.id}
              shouldDim={getStationDimmed(station)}
              canSelect={canSelectStation}
              onClick={onStationClick}
              onHover={onStationHover}
            />
          ))}
        </g>
        
        {hoveredStation && (
          <g className="metro-map__tooltip">
            <rect x={hoveredStation.x - 60} y={hoveredStation.y - 28} width="120" height="20" rx="4" fill="rgba(0, 0, 0, 0.85)" />
            <text x={hoveredStation.x} y={hoveredStation.y - 14} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" style={{ pointerEvents: 'none' }}>
              {hoveredStation.name}
            </text>
          </g>
        )}
      </svg>
      
      <div className="metro-map__hint">
        {cityConfig.language === 'fr' 
          ? 'Molette pour zoomer • Ctrl+clic pour déplacer'
          : 'Scroll to zoom • Ctrl+click to pan'}
      </div>
    </div>
  );
});

export default MetroMap;
