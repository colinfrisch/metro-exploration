import { useState, useRef, useEffect } from 'react';
import { useCity } from '../contexts/CityContext';
import type { CityId } from '../types';
import '../styles/CitySelector.css';

interface CitySelectorProps {
  onCityChange?: (cityId: CityId) => void;
}

export default function CitySelector({ onCityChange }: CitySelectorProps) {
  const { currentCity, cityConfig, switchCity, availableCities } = useCity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (cityId: CityId) => {
    if (cityId !== currentCity) {
      switchCity(cityId);
      onCityChange?.(cityId);
    }
    setIsOpen(false);
  };

  return (
    <div className="city-selector" ref={dropdownRef}>
      <button 
        className="city-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="city-selector__flag">{cityConfig.flag}</span>
        <span className="city-selector__name">{cityConfig.name}</span>
        <span className="city-selector__arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <ul className="city-selector__dropdown" role="listbox">
          {availableCities.map((city) => (
            <li
              key={city.id}
              className={`city-selector__option ${city.id === currentCity ? 'city-selector__option--active' : ''}`}
              onClick={() => handleCitySelect(city.id as CityId)}
              role="option"
              aria-selected={city.id === currentCity}
            >
              <span className="city-selector__option-flag">{city.flag}</span>
              <div className="city-selector__option-info">
                <span className="city-selector__option-name">{city.name}</span>
                <span className="city-selector__option-system">{city.systemName}</span>
              </div>
              {city.id === currentCity && (
                <span className="city-selector__check">✓</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
