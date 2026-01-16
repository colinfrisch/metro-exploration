import { forwardRef, memo, useMemo } from 'react';
import { SVG_WIDTH, SVG_HEIGHT, LINE_RENDER_ORDER, latLngToSvg, GAME_STATES } from '../utils/metro';
import ZoomControls from './ZoomControls';
import '../styles/MetroMap.css';

// Paris background paths (static, computed once)
const PARIS_OUTLINE = `
  M ${latLngToSvg(48.902, 2.28).x} ${latLngToSvg(48.902, 2.28).y}
  C ${latLngToSvg(48.91, 2.32).x} ${latLngToSvg(48.91, 2.32).y}
    ${latLngToSvg(48.905, 2.38).x} ${latLngToSvg(48.905, 2.38).y}
    ${latLngToSvg(48.895, 2.41).x} ${latLngToSvg(48.895, 2.41).y}
  C ${latLngToSvg(48.88, 2.42).x} ${latLngToSvg(48.88, 2.42).y}
    ${latLngToSvg(48.86, 2.42).x} ${latLngToSvg(48.86, 2.42).y}
    ${latLngToSvg(48.84, 2.415).x} ${latLngToSvg(48.84, 2.415).y}
  C ${latLngToSvg(48.825, 2.40).x} ${latLngToSvg(48.825, 2.40).y}
    ${latLngToSvg(48.815, 2.38).x} ${latLngToSvg(48.815, 2.38).y}
    ${latLngToSvg(48.815, 2.35).x} ${latLngToSvg(48.815, 2.35).y}
  C ${latLngToSvg(48.815, 2.32).x} ${latLngToSvg(48.815, 2.32).y}
    ${latLngToSvg(48.82, 2.28).x} ${latLngToSvg(48.82, 2.28).y}
    ${latLngToSvg(48.83, 2.25).x} ${latLngToSvg(48.83, 2.25).y}
  C ${latLngToSvg(48.845, 2.235).x} ${latLngToSvg(48.845, 2.235).y}
    ${latLngToSvg(48.86, 2.23).x} ${latLngToSvg(48.86, 2.23).y}
    ${latLngToSvg(48.875, 2.24).x} ${latLngToSvg(48.875, 2.24).y}
  C ${latLngToSvg(48.89, 2.25).x} ${latLngToSvg(48.89, 2.25).y}
    ${latLngToSvg(48.90, 2.27).x} ${latLngToSvg(48.90, 2.27).y}
    ${latLngToSvg(48.902, 2.28).x} ${latLngToSvg(48.902, 2.28).y}
  Z
`;

const SEINE_PATH = `
  M ${latLngToSvg(48.84, 2.23).x} ${latLngToSvg(48.84, 2.23).y}
  Q ${latLngToSvg(48.855, 2.28).x} ${latLngToSvg(48.855, 2.28).y}
    ${latLngToSvg(48.865, 2.32).x} ${latLngToSvg(48.865, 2.32).y}
  Q ${latLngToSvg(48.855, 2.35).x} ${latLngToSvg(48.855, 2.35).y}
    ${latLngToSvg(48.845, 2.38).x} ${latLngToSvg(48.845, 2.38).y}
  Q ${latLngToSvg(48.84, 2.40).x} ${latLngToSvg(48.84, 2.40).y}
    ${latLngToSvg(48.835, 2.42).x} ${latLngToSvg(48.835, 2.42).y}
`;

// Memoized Line component
const MetroLine = memo(function MetroLine({ 
  lineId, stations, color, isHighlighted, opacity, isSelecting, onHover 
}) {
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
const MetroStation = memo(function MetroStation({
  station, color, currentLineColor, isCurrentStation, isHovered, shouldDim, 
  canSelect, onClick, onHover
}) {
  const radius = station.isInterchange ? 5 : 3;

  return (
    <g 
      opacity={shouldDim ? 0.15 : 1}
      onMouseEnter={() => onHover(station)}
      onMouseLeave={() => onHover(null)}
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
        onClick={() => canSelect && onClick(station)}
        style={{ pointerEvents: canSelect ? 'auto' : 'none' }}
      />
      
      {isCurrentStation && !isHovered && (
        <text x={station.x} y={station.y - 15} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold" className="metro-map__station-label">
          {station.name}
        </text>
      )}
    </g>
  );
});

const MetroMap = forwardRef(function MetroMap({
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
  const isSelectingStation = gameState === GAME_STATES.SELECT_STATION;

  // Compute line visibility
  const getLineProps = useMemo(() => (lineId) => {
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
      isHighlighted = containsHoveredStation;
    } else if (isSelectingStation && hoveredLine) {
      opacity = isHoveredLine ? 1 : 0.15;
    }
    
    return { stations: lineStations, color, isHighlighted, opacity };
  }, [currentLine, hoveredLine, hoveredStation, isSelectingStation, getLineStations, getLineColor, lines]);

  // Compute station visibility
  const getStationDimmed = useMemo(() => (station) => {
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
        onCenter={() => zoomControls.centerOnStation(currentStation, ref)}
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
        <path d={PARIS_OUTLINE} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2" />
        <path d={SEINE_PATH} fill="none" stroke="rgba(100, 150, 200, 0.12)" strokeWidth="8" strokeLinecap="round" />
        
        <g className="metro-map__lines">
          {LINE_RENDER_ORDER.map(lineId => {
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
        Molette pour zoomer • Ctrl+clic pour déplacer
      </div>
    </div>
  );
});

export default MetroMap;
