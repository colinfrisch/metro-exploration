import { useMemo } from 'react';
import { ROULETTE_WITH_CHANGE, ROULETTE_NO_CHANGE } from '../utils/metro';
import '../styles/Roulette.css';

export default function Roulette({ 
  hasCorrespondence, 
  rotation, 
  isSpinning, 
  selectedSlot,
  onSpin,
  disabled 
}) {
  const options = useMemo(() => 
    hasCorrespondence ? ROULETTE_WITH_CHANGE : ROULETTE_NO_CHANGE
  , [hasCorrespondence]);

  const slotAngle = 360 / options.length;

  return (
    <div className="roulette">
      <div className="roulette__container">
        <div className="roulette__pointer">▼</div>
        <div className="roulette__wheel-wrapper">
          <div 
            className={`roulette__wheel ${!disabled && !isSpinning ? 'roulette__wheel--clickable' : ''}`}
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
            onClick={() => !disabled && !isSpinning && onSpin && onSpin()}
          >
            <svg viewBox="0 0 200 200" className="roulette__svg">
            {options.map((option, i) => {
              const startAngle = i * slotAngle - 90;
              const endAngle = (i + 1) * slotAngle - 90;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              
              const x1 = 100 + 95 * Math.cos(startRad);
              const y1 = 100 + 95 * Math.sin(startRad);
              const x2 = 100 + 95 * Math.cos(endRad);
              const y2 = 100 + 95 * Math.sin(endRad);
              
              const largeArc = slotAngle > 180 ? 1 : 0;
              const path = `M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`;
              
              const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
              const textX = 100 + 60 * Math.cos(midAngle);
              const textY = 100 + 60 * Math.sin(midAngle);
              
              return (
                <g key={i}>
                  <path
                    d={path}
                    fill={option.color}
                    stroke="#1a1a2e"
                    strokeWidth="2"
                    opacity={selectedSlot === i && !isSpinning ? 1 : 0.85}
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="20"
                    style={{ 
                      transform: `rotate(${(startAngle + endAngle) / 2 + 90}deg)`, 
                      transformOrigin: `${textX}px ${textY}px` 
                    }}
                  >
                    {option.label}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="25" fill="#1a1a2e" stroke="#FFCD00" strokeWidth="3" />
          </svg>
          </div>
          {!disabled && !isSpinning && (
            <div className="roulette__center-emoji">
              👇
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
