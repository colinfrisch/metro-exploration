import { useState } from 'react';
import '../styles/Station.css';

export default function Station({ station, color, allColors = [], onHover, isHighlighted }) {
  const [hover, setHover] = useState(false);
  
  const isInterchange = station.isInterchange || station.lines?.length > 1;
  const baseRadius = isInterchange ? 6 : 4;
  const radius = (isHighlighted || hover) ? baseRadius * 1.5 : baseRadius;
  
  const handleMouseEnter = () => {
    setHover(true);
    onHover(station);
  };
  
  const handleMouseLeave = () => {
    setHover(false);
    onHover(null);
  };

  return (
    <g className={`station ${hover || isHighlighted ? 'station--active' : ''}`}>
      {/* Glow effect */}
      {(hover || isHighlighted) && (
        <circle
          cx={station.x}
          cy={station.y}
          r={radius * 3}
          fill={color}
          opacity={0.4}
          className="station__glow"
        />
      )}
      
      {/* Station circle */}
      {isInterchange ? (
        // Interchange station: white circle with colored border
        <>
          <circle
            cx={station.x}
            cy={station.y}
            r={radius + 2}
            fill="#0d1117"
            className="station__outline"
          />
          <circle
            cx={station.x}
            cy={station.y}
            r={radius}
            fill="#ffffff"
            stroke={color}
            strokeWidth={2}
            className="station__circle station__circle--interchange"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </>
      ) : (
        // Regular station: colored circle
        <>
          <circle
            cx={station.x}
            cy={station.y}
            r={radius + 1}
            fill="#0d1117"
            className="station__outline"
          />
          <circle
            cx={station.x}
            cy={station.y}
            r={radius}
            fill={color}
            className="station__circle"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </>
      )}
    </g>
  );
}
