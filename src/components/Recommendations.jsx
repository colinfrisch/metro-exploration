import { forwardRef } from 'react';
import { useCity } from '../contexts/CityContext';
import '../styles/Recommendations.css';

const Recommendations = forwardRef(function Recommendations({ 
  stationName, 
  recommendations, 
  isLoading, 
  getDirectionsUrl 
}, ref) {
  const { cityConfig } = useCity();
  const placeTypes = cityConfig.placeTypes;

  return (
    <div className="recommendations" ref={ref}>
      <h3>🗺️ {cityConfig.text.exploreNearby} {stationName}</h3>
      
      {isLoading && (
        <div className="recommendations__loading">
          <div className="recommendations__spinner"></div>
          <p>{cityConfig.text.searchingPlaces}</p>
        </div>
      )}
      
      {recommendations?.places && (
        <div className="recommendations__grid">
          {recommendations.places.map((place, i) => (
            <div key={i} className="recommendations__card">
              <div className="recommendations__type">
                {placeTypes[place.type] || '📌'} {place.type}
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
                    🚶 {cityConfig.text.walkingDirections}
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
