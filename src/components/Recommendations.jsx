import { forwardRef } from 'react';
import { PLACE_TYPE_ICONS } from '../utils/metro';
import '../styles/Recommendations.css';

const Recommendations = forwardRef(function Recommendations({ 
  stationName, 
  recommendations, 
  isLoading, 
  getDirectionsUrl 
}, ref) {
  return (
    <div className="recommendations" ref={ref}>
      <h3>🗺️ Explorez les alentours de {stationName}</h3>
      
      {isLoading && (
        <div className="recommendations__loading">
          <div className="recommendations__spinner"></div>
          <p>Recherche des lieux à proximité...</p>
        </div>
      )}
      
      {recommendations?.places && (
        <div className="recommendations__grid">
          {recommendations.places.map((place, i) => (
            <div key={i} className="recommendations__card">
              <div className="recommendations__type">
                {PLACE_TYPE_ICONS[place.type] || '📌'} {place.type}
              </div>
              <h4 className="recommendations__name">{place.name}</h4>
              <p className="recommendations__desc">{place.description}</p>
              {place.address && (
                <>
                  <p className="recommendations__address">📍 {place.address}</p>
                  <a 
                    href={getDirectionsUrl(place.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="recommendations__link"
                  >
                    🚶 Itinéraire à pied
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default Recommendations;
