import '../styles/Tooltip.css';

export default function Tooltip({ station, lines, position, getLineColor }) {
  if (!station) return null;

  // Get lines that pass through this station
  const stationLines = station.lines || [];

  return (
    <div
      className="tooltip"
      style={{
        left: Math.min(position.x + 15, window.innerWidth - 280),
        top: Math.max(10, position.y - 10),
      }}
    >
      <div className="tooltip__name">{station.name}</div>
      
      {stationLines.length > 1 && (
        <div className="tooltip__interchange">Correspondance</div>
      )}
      
      <div className="tooltip__lines">
        {stationLines.map((lineId) => {
          const line = lines.find(l => l.id === lineId);
          const color = getLineColor ? getLineColor(lineId) : (line?.color || '#fff');
          const textColor = line?.textColor || '#000';
          
          return (
            <span
              key={lineId}
              className="tooltip__line-badge"
              style={{ backgroundColor: color, color: textColor }}
            >
              {lineId}
            </span>
          );
        })}
      </div>
    </div>
  );
}
