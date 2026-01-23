import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { GAME_STATES, ROULETTE_WITH_CHANGE, ROULETTE_NO_CHANGE } from '../utils/metro';
import { useCity } from '../contexts/CityContext';
import { useMetroData, useZoomPan } from '../hooks';
import Header from './Header';
import MetroMap from './MetroMap';
import GamePanel from './GamePanel';
import JourneyTrack from './JourneyTrack';
import Recommendations from './Recommendations';
import type { Station, GameState, HistoryEntry, RouletteSlot } from '../types';
import '../styles/Game.css';

interface GameRecommendations {
  places: import('../types').Place[];
  stationCoords: { lat: number; lng: number };
  stationName: string;
}

export default function Game() {
  // City context
  const { currentCity, cityConfig } = useCity();

  // Game state
  const [gameState, setGameState] = useState<GameState>(GAME_STATES.SELECT_STATION);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [currentLine, setCurrentLine] = useState<string | null>(null);
  const [direction, setDirection] = useState<number>(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [message, setMessage] = useState<string>(cityConfig.text.selectStation);

  // Roulette state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rouletteRotation, setRouletteRotation] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // UI state
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<GameRecommendations | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);

  // Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const recommendationsRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { zoom, pan, isPanning, handlers: zoomHandlers, controls: zoomControls } = useZoomPan();
  const { 
    stations, lines, allStations, isLoading, error,
    getLineColor, getLineData, getLineStations, getLinesForStation, 
    getNextStation, getDirectionLabels, getRecommendations
  } = useMetroData();

  // Reset game when city changes
  useEffect(() => {
    setGameState(GAME_STATES.SELECT_STATION);
    setCurrentStation(null);
    setCurrentLine(null);
    setDirection(1);
    setRouletteRotation(0);
    setSelectedSlot(null);
    setHistory([]);
    setMessage(cityConfig.text.selectStation);
    setRecommendations(null);
    setIsLoadingRecommendations(false);
    zoomControls.resetZoom();
  }, [currentCity, cityConfig.text.selectStation]);

  // Computed values
  const hasCorrespondence = useMemo<boolean>(() => {
    if (!currentStation) return false;
    const availableLines = getLinesForStation(currentStation.id);
    return availableLines.filter(l => l !== currentLine).length > 0;
  }, [currentStation, currentLine, getLinesForStation]);

  const rouletteOptions = useMemo<RouletteSlot[]>(() => 
    hasCorrespondence ? ROULETTE_WITH_CHANGE : ROULETTE_NO_CHANGE
  , [hasCorrespondence]);

  const canSelectStation = gameState === GAME_STATES.SELECT_STATION || 
                           gameState === GAME_STATES.SELECT_LINE || 
                           gameState === GAME_STATES.SELECT_DIRECTION;

  const directionLabels = useMemo(() => 
    getDirectionLabels(currentStation, currentLine)
  , [getDirectionLabels, currentStation, currentLine]);

  const availableLines = useMemo<string[]>(() => 
    currentStation ? getLinesForStation(currentStation.id) : []
  , [currentStation, getLinesForStation]);

  // Event handlers
  const handleStationClick = useCallback((station: Station) => {
    if (!canSelectStation) return;
    
    setCurrentStation(station);
    setCurrentLine(null);
    setDirection(1);
    const stationLines = getLinesForStation(station.id);
    
    if (stationLines.length === 1) {
      setCurrentLine(stationLines[0]);
      setGameState(GAME_STATES.SELECT_DIRECTION);
      setMessage(cityConfig.text.selectDirection);
    } else {
      setGameState(GAME_STATES.SELECT_LINE);
      setMessage(cityConfig.text.selectLine);
    }
    setHistory([{ station, action: 'start' }]);
  }, [canSelectStation, getLinesForStation, cityConfig.text]);

  const handleLineSelect = useCallback((lineId: string) => {
    setCurrentLine(lineId);
    setGameState(GAME_STATES.SELECT_DIRECTION);
    setMessage(cityConfig.text.selectDirection);
  }, [cityConfig.text]);

  const handleDirectionSelect = useCallback((dir: number) => {
    setDirection(dir);
    setGameState(GAME_STATES.PLAYING);
    setMessage(cityConfig.text.spinRoulette);
  }, [cityConfig.text]);

  const handleRouletteResult = useCallback((result: RouletteSlot) => {
    switch (result.type) {
      case 'continue': {
        const nextStation = getNextStation(currentStation, currentLine, direction);
        if (nextStation) {
          setCurrentStation(nextStation);
          setHistory(prev => [...prev, { station: nextStation, action: 'move', line: currentLine || undefined }]);
          setMessage(`${cityConfig.text.advanceTo} ${nextStation.name}. ${cityConfig.text.relaunch}`);
        } else {
          setDirection(d => -d);
          setMessage(`${cityConfig.text.endOfLine} ${cityConfig.text.relaunch}`);
          setHistory(prev => [...prev, { station: currentStation!, action: 'reverse' }]);
        }
        break;
      }
      case 'change': {
        const stationLines = getLinesForStation(currentStation!.id);
        const otherLines = stationLines.filter(l => l !== currentLine);
        if (otherLines.length > 0) {
          const newLine = otherLines[Math.floor(Math.random() * otherLines.length)];
          setCurrentLine(newLine);
          const lineData = getLineData(newLine);
          setMessage(`${cityConfig.text.changeLine} ${lineData?.name || newLine}. ${cityConfig.text.relaunch}`);
          setHistory(prev => [...prev, { station: currentStation!, action: 'change', line: newLine }]);
        }
        break;
      }
      case 'exit':
        setGameState(GAME_STATES.CONFIRM_EXIT);
        setMessage(`🚪 ${cityConfig.text.confirmExit}`);
        break;
    }
  }, [currentStation, currentLine, direction, getNextStation, getLinesForStation, getLineData, cityConfig.text]);

  const spinRoulette = useCallback(() => {
    if (isSpinning || gameState !== GAME_STATES.PLAYING) return;
    
    setIsSpinning(true);
    setSelectedSlot(null);
    
    const SLOT_COUNT = 10;
    const SLOT_ANGLE = 360 / SLOT_COUNT;
    const fullRotations = 3 + Math.floor(Math.random() * 3);
    const randomSlot = Math.floor(Math.random() * SLOT_COUNT);
    
    const currentMod = ((rouletteRotation % 360) + 360) % 360;
    const targetMod = (342 - randomSlot * SLOT_ANGLE + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;
    
    setRouletteRotation(prev => prev + fullRotations * 360 + delta);
    
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedSlot(randomSlot);
      handleRouletteResult(rouletteOptions[randomSlot]);
    }, 3000);
  }, [isSpinning, gameState, rouletteRotation, rouletteOptions, handleRouletteResult]);

  // Load recommendations from local data
  const fetchRecommendations = useCallback((stationId: string, stationName: string, lat: number, lng: number) => {
    setIsLoadingRecommendations(true);
    setRecommendations(null);
    
    // Simulate async loading for smooth UX
    setTimeout(() => {
      const places = getRecommendations(stationId);
      setRecommendations({ 
        places, 
        stationCoords: { lat, lng }, 
        stationName 
      });
      setIsLoadingRecommendations(false);
    }, 300);
  }, [getRecommendations]);

  const handleConfirmExit = useCallback((validated: boolean) => {
    if (validated) {
      setGameState(GAME_STATES.WON);
      setMessage(`🎉 ${cityConfig.text.exitConfirmed} ${currentStation!.name} !`);
      setHistory(prev => [...prev, { station: currentStation!, action: 'exit' }]);
      const stationData = stations[currentStation!.id];
      fetchRecommendations(currentStation!.id, currentStation!.name, stationData.lat, stationData.lng);
      setTimeout(() => recommendationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else {
      setGameState(GAME_STATES.PLAYING);
      setMessage(cityConfig.text.stayInMetro);
    }
  }, [currentStation, stations, fetchRecommendations, cityConfig.text]);

  const resetGame = useCallback(() => {
    setGameState(GAME_STATES.SELECT_STATION);
    setCurrentStation(null);
    setCurrentLine(null);
    setDirection(1);
    setRouletteRotation(0);
    setSelectedSlot(null);
    setHistory([]);
    setMessage(cityConfig.text.selectStation);
    setRecommendations(null);
    setIsLoadingRecommendations(false);
    zoomControls.resetZoom();
  }, [zoomControls, cityConfig.text]);

  const getGoogleMapsDirectionsUrl = useCallback((address: string): string => {
    if (!recommendations?.stationCoords) return '';
    const { lat, lng } = recommendations.stationCoords;
    const cityName = cityConfig.name;
    return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(address + ", " + cityName)}&travelmode=walking`;
  }, [recommendations, cityConfig.name]);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="game">
        <Header />
        <div className="game__loading">
          <div className="game__loading-spinner"></div>
          <p>Loading {cityConfig.name} {cityConfig.systemName}...</p>
        </div>
      </div>
    );
  }

  // Show error state if data failed to load
  if (error) {
    return (
      <div className="game">
        <Header />
        <div className="game__error">
          <p>Failed to load metro data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <Header />

      <div className="game__content">
        <MetroMap
          ref={mapContainerRef}
          gameState={gameState}
          allStations={allStations}
          lines={lines}
          currentStation={currentStation}
          currentLine={currentLine}
          hoveredStation={hoveredStation}
          hoveredLine={hoveredLine}
          canSelectStation={canSelectStation}
          zoom={zoom}
          pan={pan}
          isPanning={isPanning}
          zoomHandlers={zoomHandlers}
          zoomControls={zoomControls}
          getLineColor={getLineColor}
          getLineStations={getLineStations}
          onStationClick={handleStationClick}
          onStationHover={setHoveredStation}
          onLineHover={setHoveredLine}
        />

        <GamePanel
          gameState={gameState}
          message={message}
          currentStation={currentStation}
          availableLines={availableLines}
          directionLabels={directionLabels}
          hasCorrespondence={hasCorrespondence}
          rouletteRotation={rouletteRotation}
          isSpinning={isSpinning}
          selectedSlot={selectedSlot}
          history={history}
          onLineSelect={handleLineSelect}
          onDirectionSelect={handleDirectionSelect}
          onSpin={spinRoulette}
          onConfirmExit={handleConfirmExit}
          onReset={resetGame}
          getLineColor={getLineColor}
          getLineData={getLineData}
        />
      </div>
      
      <JourneyTrack history={history} getLineColor={getLineColor} currentLine={currentLine} />
      
      {gameState === GAME_STATES.WON && (
        <Recommendations
          ref={recommendationsRef}
          stationName={currentStation?.name || ''}
          recommendations={recommendations}
          isLoading={isLoadingRecommendations}
          getDirectionsUrl={getGoogleMapsDirectionsUrl}
        />
      )}
    </div>
  );
}
