import { JOURNEY_ICONS } from '../utils/metro';
import '../styles/JourneyTrack.css';

export default function JourneyTrack({ history, getLineColor, currentLine }) {
  if (history.length === 0) return null;

  return (
    <div className="journey">
      <div className="journey__track">
        {history.map((h, i) => (
          <div key={i} className="journey__stop">
            <div className="journey__icon">
              {JOURNEY_ICONS[h.action]}
            </div>
            <div className="journey__name">{h.station.name}</div>
            {i < history.length - 1 && (
              <div 
                className="journey__line" 
                style={{ backgroundColor: getLineColor(h.line || currentLine) }} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
