import { useState, useMemo, useCallback, useRef } from 'react';
import { GAME_STATES, ROULETTE_WITH_CHANGE, ROULETTE_NO_CHANGE } from '../utils/metro';
import { useMetroData, useZoomPan } from '../hooks';
import Header from './Header';
import MetroMap from './MetroMap';
import GamePanel from './GamePanel';
import JourneyTrack from './JourneyTrack';
import Recommendations from './Recommendations';
import stationRecommendationsData from '../data/station_recommendations.json';
import '../styles/Game.css';

export default function Game() {
  // Game state
  const [gameState, setGameState] = useState(GAME_STATES.SELECT_STATION);
  const [currentStation, setCurrentStation] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [direction, setDirection] = useState(1);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("Sélectionnez une station de départ");

  // Roulette state
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // UI state
  const [hoveredLine, setHoveredLine] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Refs
  const mapContainerRef = useRef(null);
  const recommendationsRef = useRef(null);

  // Custom hooks
  const { zoom, pan, isPanning, handlers: zoomHandlers, controls: zoomControls } = useZoomPan();
  const { 
    stations, lines, allStations, 
    getLineColor, getLineData, getLineStations, getLinesForStation, 
    getNextStation, getDirectionLabels 
  } = useMetroData();

  // Computed values
  const hasCorrespondence = useMemo(() => {
    if (!currentStation) return false;
    const availableLines = getLinesForStation(currentStation.id);
    return availableLines.filter(l => l !== currentLine).length > 0;
  }, [currentStation, currentLine, getLinesForStation]);

  const rouletteOptions = useMemo(() => 
    hasCorrespondence ? ROULETTE_WITH_CHANGE : ROULETTE_NO_CHANGE
  , [hasCorrespondence]);

  const canSelectStation = gameState === GAME_STATES.SELECT_STATION || 
                           gameState === GAME_STATES.SELECT_LINE || 
                           gameState === GAME_STATES.SELECT_DIRECTION;

  const directionLabels = useMemo(() => 
    getDirectionLabels(currentStation, currentLine)
  , [getDirectionLabels, currentStation, currentLine]);

  const availableLines = useMemo(() => 
    currentStation ? getLinesForStation(currentStation.id) : []
  , [currentStation, getLinesForStation]);

  // Event handlers
  const handleStationClick = useCallback((station) => {
    if (!canSelectStation) return;
    
    setCurrentStation(station);
    setCurrentLine(null);
    setDirection(1);
    const stationLines = getLinesForStation(station.id);
    
    if (stationLines.length === 1) {
      setCurrentLine(stationLines[0]);
      setGameState(GAME_STATES.SELECT_DIRECTION);
      setMessage("Choisissez une direction");
    } else {
      setGameState(GAME_STATES.SELECT_LINE);
      setMessage("Choisissez une ligne");
    }
    setHistory([{ station, action: 'start' }]);
  }, [canSelectStation, getLinesForStation]);

  const handleLineSelect = useCallback((lineId) => {
    setCurrentLine(lineId);
    setGameState(GAME_STATES.SELECT_DIRECTION);
    setMessage("Choisissez une direction");
  }, []);

  const handleDirectionSelect = useCallback((dir) => {
    setDirection(dir);
    setGameState(GAME_STATES.PLAYING);
    setMessage("Faites tourner la roulette !");
  }, []);

  const handleRouletteResult = useCallback((result) => {
    switch (result.type) {
      case 'continue': {
        const nextStation = getNextStation(currentStation, currentLine, direction);
        if (nextStation) {
          setCurrentStation(nextStation);
          setHistory(prev => [...prev, { station: nextStation, action: 'move', line: currentLine }]);
          setMessage(`Vous avancez à ${nextStation.name}. Relancez la roulette !`);
        } else {
          setDirection(d => -d);
          setMessage("Fin de ligne ! Vous faites demi-tour. Relancez la roulette !");
          setHistory(prev => [...prev, { station: currentStation, action: 'reverse' }]);
        }
        break;
      }
      case 'change': {
        const stationLines = getLinesForStation(currentStation.id);
        const otherLines = stationLines.filter(l => l !== currentLine);
        if (otherLines.length > 0) {
          const newLine = otherLines[Math.floor(Math.random() * otherLines.length)];
          setCurrentLine(newLine);
          const lineData = getLineData(newLine);
          setMessage(`Changement ! Vous prenez la ${lineData?.name || newLine}. Relancez la roulette !`);
          setHistory(prev => [...prev, { station: currentStation, action: 'change', line: newLine }]);
        }
        break;
      }
      case 'exit':
        setGameState(GAME_STATES.CONFIRM_EXIT);
        setMessage(`🚪 Sortie à ${currentStation.name} ! Validez-vous cette destination ?`);
        break;
    }
  }, [currentStation, currentLine, direction, getNextStation, getLinesForStation, getLineData]);

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
  const fetchRecommendations = useCallback((stationId, stationName, lat, lng) => {
    setIsLoadingRecommendations(true);
    setRecommendations(null);
    
    // Simulate async loading for smooth UX
    setTimeout(() => {
      const places = stationRecommendationsData[stationId] || [];
      setRecommendations({ 
        places, 
        stationCoords: { lat, lng }, 
        stationName 
      });
      setIsLoadingRecommendations(false);
    }, 300);
  }, []);

  const handleConfirmExit = useCallback((validated) => {
    if (validated) {
      setGameState(GAME_STATES.WON);
      setMessage(`🎉 Vous sortez à ${currentStation.name} !`);
      setHistory(prev => [...prev, { station: currentStation, action: 'exit' }]);
      const stationData = stations[currentStation.id];
      fetchRecommendations(currentStation.id, currentStation.name, stationData.lat, stationData.lng);
      setTimeout(() => recommendationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } else {
      setGameState(GAME_STATES.PLAYING);
      setMessage("Vous restez dans le métro ! Relancez la roulette !");
    }
  }, [currentStation, stations, fetchRecommendations]);

  const resetGame = useCallback(() => {
    setGameState(GAME_STATES.SELECT_STATION);
    setCurrentStation(null);
    setCurrentLine(null);
    setDirection(1);
    setRouletteRotation(0);
    setSelectedSlot(null);
    setHistory([]);
    setMessage("Sélectionnez une station de départ");
    setRecommendations(null);
    setIsLoadingRecommendations(false);
    zoomControls.resetZoom();
  }, [zoomControls]);

  const getGoogleMapsDirectionsUrl = useCallback((address) => {
    if (!recommendations?.stationCoords) return null;
    const { lat, lng } = recommendations.stationCoords;
    return `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=${encodeURIComponent(address + ", Paris, France")}&travelmode=walking`;
  }, [recommendations]);

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
          stationName={currentStation?.name}
          recommendations={recommendations}
          isLoading={isLoadingRecommendations}
          getDirectionsUrl={getGoogleMapsDirectionsUrl}
        />
      )}
    </div>
  );
}
