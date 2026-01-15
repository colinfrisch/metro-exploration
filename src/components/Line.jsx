import '../styles/Line.css';

export default function Line({ stations, color, lineId, isHighlighted, opacity = 1 }) {
  if (!stations || stations.length < 2) return null;

  // Filter out any stations with invalid coordinates
  const validStations = stations.filter(s => 
    s && typeof s.x === 'number' && typeof s.y === 'number' && !isNaN(s.x) && !isNaN(s.y)
  );

  if (validStations.length < 2) return null;

  // Create polyline points from stations
  const points = validStations.map(s => `${s.x},${s.y}`).join(' ');

  return (
    <g className={`line line-${lineId} ${isHighlighted ? 'line--highlighted' : ''}`}>
      {/* Line shadow/glow when highlighted */}
      {isHighlighted && (
        <polyline
          points={points}
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.3}
          className="line__glow"
        />
      )}
      
      {/* Main line */}
      <polyline
        points={points}
        stroke={color}
        strokeWidth={isHighlighted ? 5 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
        className="line__path"
      />
    </g>
  );
}
