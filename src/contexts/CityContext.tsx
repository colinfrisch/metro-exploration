import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { CityConfig, CityId } from '../types';

// City configurations with display info and map settings
export const CITIES: Record<CityId, CityConfig> = {
  paris: {
    id: 'paris',
    name: 'Paris',
    country: 'France',
    flag: '🇫🇷',
    systemName: 'Métro',
    language: 'fr',
    bounds: {
      minLat: 48.72,
      maxLat: 48.95,
      minLng: 2.22,
      maxLng: 2.47
    },
    text: {
      selectStation: "Sélectionnez une station de départ",
      selectLine: "Choisissez une ligne",
      selectDirection: "Choisissez une direction",
      spinRoulette: "Faites tourner la roulette !",
      confirmExit: "Sortie ! Validez-vous cette destination ?",
      exitConfirmed: "Vous sortez à",
      stayInMetro: "Vous restez dans le métro ! Relancez la roulette !",
      advanceTo: "Vous avancez à",
      relaunch: "Relancez la roulette !",
      endOfLine: "Fin de ligne ! Vous faites demi-tour.",
      changeLine: "Changement ! Vous prenez la",
      exploreNearby: "Explorez les alentours de",
      walkingDirections: "Itinéraire à pied",
      searchingPlaces: "Recherche des lieux à proximité...",
      direction: "Direction",
      forward: "Direction 1",
      backward: "Direction 2"
    },
    placeTypes: {
      restaurant: '🍽️',
      monument: '🏛️',
      musée: '🎨',
      parc: '🌳',
      shopping: '🛍️',
      café: '☕',
      bar: '🍸',
      autre: '📌'
    }
  },
  london: {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    systemName: 'Tube',
    language: 'en',
    bounds: {
      minLat: 51.38,
      maxLat: 51.72,
      minLng: -0.62,
      maxLng: 0.28
    },
    text: {
      selectStation: "Select a starting station",
      selectLine: "Choose a line",
      selectDirection: "Choose a direction",
      spinRoulette: "Spin the roulette!",
      confirmExit: "Exit! Do you confirm this destination?",
      exitConfirmed: "You exit at",
      stayInMetro: "You stay on the tube! Spin again!",
      advanceTo: "You advance to",
      relaunch: "Spin the roulette!",
      endOfLine: "End of the line! You turn around.",
      changeLine: "Change! You take the",
      exploreNearby: "Explore around",
      walkingDirections: "Walking directions",
      searchingPlaces: "Searching for nearby places...",
      direction: "Direction",
      forward: "Direction 1",
      backward: "Direction 2"
    },
    placeTypes: {
      restaurant: '🍽️',
      monument: '🏛️',
      museum: '🎨',
      park: '🌳',
      shopping: '🛍️',
      café: '☕',
      pub: '🍺',
      other: '📌'
    }
  },
  singapore: {
    id: 'singapore',
    name: 'Singapore',
    country: 'Singapore',
    flag: '🇸🇬',
    systemName: 'MRT',
    language: 'en',
    bounds: {
      minLat: 1.24,
      maxLat: 1.47,
      minLng: 103.60,
      maxLng: 104.05
    },
    text: {
      selectStation: "Select a starting station",
      selectLine: "Choose a line",
      selectDirection: "Choose a direction",
      spinRoulette: "Spin the roulette!",
      confirmExit: "Exit! Do you confirm this destination?",
      exitConfirmed: "You exit at",
      stayInMetro: "You stay on the MRT! Spin again!",
      advanceTo: "You advance to",
      relaunch: "Spin the roulette!",
      endOfLine: "End of the line! You turn around.",
      changeLine: "Change! You take the",
      exploreNearby: "Explore around",
      walkingDirections: "Walking directions",
      searchingPlaces: "Searching for nearby places...",
      direction: "Direction",
      forward: "Direction 1",
      backward: "Direction 2"
    },
    placeTypes: {
      restaurant: '🍽️',
      monument: '🏛️',
      museum: '🎨',
      park: '🌳',
      shopping: '🛍️',
      café: '☕',
      hawker: '🍜',
      other: '📌'
    }
  }
};

interface CityContextValue {
  currentCity: CityId;
  cityConfig: CityConfig;
  switchCity: (cityId: CityId) => void;
  availableCities: CityConfig[];
}

const CityContext = createContext<CityContextValue | null>(null);

interface CityProviderProps {
  children: ReactNode;
}

export function CityProvider({ children }: CityProviderProps) {
  const [currentCity, setCurrentCity] = useState<CityId>('paris');

  const cityConfig = useMemo(() => CITIES[currentCity], [currentCity]);

  const switchCity = useCallback((cityId: CityId) => {
    if (CITIES[cityId]) {
      setCurrentCity(cityId);
    }
  }, []);

  const availableCities = useMemo(() => Object.values(CITIES), []);

  const value = useMemo<CityContextValue>(() => ({
    currentCity,
    cityConfig,
    switchCity,
    availableCities
  }), [currentCity, cityConfig, switchCity, availableCities]);

  return (
    <CityContext.Provider value={value}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity(): CityContextValue {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used within a CityProvider');
  }
  return context;
}
