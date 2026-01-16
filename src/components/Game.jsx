import { useState, useMemo, useCallback, useRef } from 'react';
import linesData from '../data/lines.json';
import stationsData from '../data/stations.json';
import '../styles/Game.css';

const BOUNDS = {
  minLat: 48.72,
  maxLat: 48.95,
  minLng: 2.22,
  maxLng: 2.47
};

const SVG_WIDTH = 1000;
const SVG_HEIGHT = 850;
const PADDING = 40;

function latLngToSvg(lat, lng) {
  const x = PADDING + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (SVG_WIDTH - 2 * PADDING);
  const y = PADDING + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (SVG_HEIGHT - 2 * PADDING);
  return { x, y };
}

const GAME_STATES = {
  SELECT_STATION: 'SELECT_STATION',
  SELECT_LINE: 'SELECT_LINE',
  SELECT_DIRECTION: 'SELECT_DIRECTION',
  PLAYING: 'PLAYING',
  CONFIRM_EXIT: 'CONFIRM_EXIT',
  WON: 'WON'
};

// Roulette options
const ROULETTE_WITH_CHANGE = [
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'change', label: '🔄', color: '#3b82f6' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
];

const ROULETTE_NO_CHANGE = [
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'continue', label: '→', color: '#22c55e' },
  { type: 'exit', label: '🚪', color: '#ef4444' },
];

export default function Game() {
  const [gameState, setGameState] = useState(GAME_STATES.SELECT_STATION);
  const [currentStation, setCurrentStation] = useState(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [direction, setDirection] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteRotation, setRouletteRotation] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("Sélectionnez une station de départ");
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef(null);
  
  // Recommendations state
  const [recommendations, setRecommendations] = useState(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
  // Hovered line/station state (for initial selection)
  const [hoveredLine, setHoveredLine] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);

  const { stations, lines } = stationsData;

  const processedStations = useMemo(() => {
    const result = {};
    Object.entries(stations).forEach(([id, station]) => {
      const { x, y } = latLngToSvg(station.lat, station.lng);
      result[id] = {
        ...station,
        id,
        x,
        y,
        isInterchange: station.lines.length > 1
      };
    });
    return result;
  }, [stations]);

  const allStations = useMemo(() => Object.values(processedStations), [processedStations]);

  const getLineColor = useCallback((lineId) => {
    const baseLineId = lineId.split('-')[0];
    const line = linesData.find(l => l.id === baseLineId);
    return line?.color || '#ffffff';
  }, []);

  const getLineStations = useCallback((lineId) => {
    const lineStationIds = lines[lineId];
    if (!lineStationIds) return [];
    return lineStationIds.map(id => processedStations[id]).filter(Boolean);
  }, [lines, processedStations]);

  const getLineData = useCallback((lineId) => {
    const baseLineId = lineId.split('-')[0];
    return linesData.find(l => l.id === baseLineId);
  }, []);

  const getLinesForStation = useCallback((stationId) => {
    const lineIds = [];
    Object.entries(lines).forEach(([lineId, stationIds]) => {
      if (stationIds.includes(stationId)) {
        lineIds.push(lineId);
      }
    });
    return lineIds;
  }, [lines]);

  // Check if current station has correspondences
  const hasCorrespondence = useMemo(() => {
    if (!currentStation) return false;
    const availableLines = getLinesForStation(currentStation.id);
    return availableLines.filter(l => l !== currentLine).length > 0;
  }, [currentStation, currentLine, getLinesForStation]);

  // Get current roulette options
  const rouletteOptions = useMemo(() => {
    return hasCorrespondence ? ROULETTE_WITH_CHANGE : ROULETTE_NO_CHANGE;
  }, [hasCorrespondence]);

  // Zoom handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(Math.max(0.5, z + delta), 4));
  };

  const handleMouseDown = (e) => {
    if (e.button === 0 && (e.ctrlKey || e.metaKey || zoom > 1)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));

  const centerOnStation = useCallback(() => {
    if (currentStation && mapContainerRef.current) {
      const container = mapContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      const scaleX = containerRect.width / SVG_WIDTH;
      const scaleY = containerRect.height / SVG_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      
      const stationScreenX = currentStation.x * scale * zoom;
      const stationScreenY = currentStation.y * scale * zoom;
      
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;
      
      setPan({
        x: centerX - stationScreenX,
        y: centerY - stationScreenY
      });
    }
  }, [currentStation, zoom]);

  // Can select station during these states
  const canSelectStation = gameState === GAME_STATES.SELECT_STATION || 
                           gameState === GAME_STATES.SELECT_LINE || 
                           gameState === GAME_STATES.SELECT_DIRECTION;

  const handleStationClick = (station) => {
    if (canSelectStation) {
      setCurrentStation(station);
      setCurrentLine(null);
      setDirection(1);
      const availableLines = getLinesForStation(station.id);
      
      if (availableLines.length === 1) {
        setCurrentLine(availableLines[0]);
        setGameState(GAME_STATES.SELECT_DIRECTION);
        setMessage("Choisissez une direction");
      } else {
        setGameState(GAME_STATES.SELECT_LINE);
        setMessage("Choisissez une ligne");
      }
      setHistory([{ station, action: 'start' }]);
    }
  };

  const handleLineSelect = (lineId) => {
    setCurrentLine(lineId);
    setGameState(GAME_STATES.SELECT_DIRECTION);
    setMessage("Choisissez une direction");
  };

  const handleDirectionSelect = (dir) => {
    setDirection(dir);
    setGameState(GAME_STATES.PLAYING);
    setMessage("Faites tourner la roulette !");
  };

  const getNextStation = useCallback(() => {
    if (!currentStation || !currentLine) return null;
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return null;
    
    const currentIndex = lineStationIds.indexOf(currentStation.id);
    if (currentIndex === -1) return null;
    
    const nextIndex = currentIndex + direction;
    
    if (nextIndex < 0 || nextIndex >= lineStationIds.length) {
      return null;
    }
    
    return processedStations[lineStationIds[nextIndex]];
  }, [currentStation, currentLine, direction, lines, processedStations]);

  const getDirectionLabels = useCallback(() => {
    if (!currentStation || !currentLine) return { forward: "Direction 1", backward: "Direction 2" };
    
    const lineStationIds = lines[currentLine];
    if (!lineStationIds) return { forward: "Direction 1", backward: "Direction 2" };
    
    const firstStation = processedStations[lineStationIds[0]];
    const lastStation = processedStations[lineStationIds[lineStationIds.length - 1]];
    
    return {
      forward: `→ ${lastStation?.name || "Terminus"}`,
      backward: `← ${firstStation?.name || "Terminus"}`
    };
  }, [currentStation, currentLine, lines, processedStations]);

  // Spin the roulette
  const spinRoulette = () => {
    if (isSpinning || gameState !== GAME_STATES.PLAYING) return;
    
    setIsSpinning(true);
    setSelectedSlot(null);
    
    const fullRotations = 3 + Math.floor(Math.random() * 3);
    const randomSlot = Math.floor(Math.random() * 10);
    const slotAngle = 36; // 360 / 10 slots
    
    // Calculate current wheel position (mod 360)
    const currentMod = ((rouletteRotation % 360) + 360) % 360;
    
    // Target rotation to land on slot randomSlot
    // Slot i center is at angle (i*36 - 72). For pointer at -90° to point at slot i:
    // We need rotation R where: -90 - R ≡ i*36 - 72 (mod 360)
    // R ≡ -90 - (i*36 - 72) ≡ -18 - i*36 ≡ 342 - i*36 (mod 360)
    const targetMod = (342 - randomSlot * slotAngle + 360) % 360;
    
    // Calculate delta from current to target (always positive, always forward)
    let delta = targetMod - currentMod;
    if (delta <= 0) delta += 360;
    
    // Final rotation = current + full spins + delta
    const finalRotation = rouletteRotation + fullRotations * 360 + delta;
    
    setRouletteRotation(finalRotation);
    
    // Wait for animation to finish
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedSlot(randomSlot);
      handleRouletteResult(rouletteOptions[randomSlot]);
    }, 3000);
  };

  const handleRouletteResult = (result) => {
    switch (result.type) {
      case 'continue': {
        const nextStation = getNextStation();
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
        const availableLines = getLinesForStation(currentStation.id);
        const otherLines = availableLines.filter(l => l !== currentLine);
        
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
  };

  // Fetch recommendations from Mistral with structured outputs
  const fetchRecommendations = async (stationName, stationLat, stationLng) => {
    setIsLoadingRecommendations(true);
    setRecommendations(null);
    
    const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
    
    if (!apiKey || apiKey === 'your_mistral_api_key_here') {
      // Demo mode without API key
      setRecommendations({
        places: [
          { 
            name: "Lieu à découvrir", 
            type: "monument", 
            description: "Ajoutez votre clé API Mistral dans .env pour obtenir de vraies recommandations",
            address: "Paris, France"
          }
        ],
        stationCoords: { lat: stationLat, lng: stationLng }
      });
      setIsLoadingRecommendations(false);
      return;
    }
    
    // JSON Schema for structured output
    const placesSchema = {
      type: "object",
      properties: {
        places: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nom du lieu" },
              type: { type: "string", enum: ["restaurant", "monument", "musée", "parc", "shopping", "café", "bar", "autre"] },
              description: { type: "string", description: "Description courte en une phrase" },
              address: { type: "string", description: "Adresse complète du lieu à Paris" }
            },
            required: ["name", "type", "description", "address"]
          }
        }
      },
      required: ["places"]
    };
    
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [
            {
              role: 'system',
              content: 'Guide touristique parisien. Réponses concises.'
            },
            {
              role: 'user',
              content: `Station ${stationName}: 4 lieux proches à visiter (nom, type, 1 phrase, adresse).`
            }
          ],
          temperature: 0.3,
          max_tokens: 450,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "recommendations",
              strict: true,
              schema: placesSchema
            }
          }
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        const parsed = JSON.parse(data.choices[0].message.content);
        setRecommendations({
          ...parsed,
          stationCoords: { lat: stationLat, lng: stationLng },
          stationName: stationName
        });
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations({
        places: [
          { 
            name: "Erreur", 
            type: "autre", 
            description: "Impossible de charger les recommandations. Vérifiez votre connexion.",
            address: "Paris"
          }
        ],
        stationCoords: { lat: stationLat, lng: stationLng }
      });
    }
    
    setIsLoadingRecommendations(false);
  };
  
  // Generate Google Maps directions URL
  const getGoogleMapsDirectionsUrl = (destinationAddress) => {
    if (!recommendations?.stationCoords) return null;
    const { lat, lng } = recommendations.stationCoords;
    const origin = `${lat},${lng}`;
    const destination = encodeURIComponent(destinationAddress + ", Paris, France");
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  };

  // Handle exit confirmation
  const handleConfirmExit = (validated) => {
    if (validated) {
      setGameState(GAME_STATES.WON);
      setMessage(`🎉 Vous sortez à ${currentStation.name} !`);
      setHistory(prev => [...prev, { station: currentStation, action: 'exit' }]);
      // Get station GPS coordinates from original data
      const stationData = stations[currentStation.id];
      fetchRecommendations(currentStation.name, stationData?.lat, stationData?.lng);
    } else {
      // Continue playing as if exit didn't happen
      setGameState(GAME_STATES.PLAYING);
      setMessage("Vous restez dans le métro ! Relancez la roulette !");
    }
  };

  const resetGame = () => {
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
    resetZoom();
  };

  const renderLine = (lineId) => {
    const lineStations = getLineStations(lineId);
    if (lineStations.length < 2) return null;
    
    const points = lineStations.map(s => `${s.x},${s.y}`).join(' ');
    const color = getLineColor(lineId);
    const isCurrentLine = currentLine === lineId;
    const isHoveredLine = hoveredLine === lineId;
    const isSelectingStation = gameState === GAME_STATES.SELECT_STATION;
    
    // Check if this line contains the hovered station
    const lineStationIds = lines[lineId] || [];
    const containsHoveredStation = hoveredStation && lineStationIds.includes(hoveredStation.id);
    
    // Determine opacity based on state
    let opacity = 0.8;
    let isHighlighted = isCurrentLine || isHoveredLine;
    
    if (currentLine) {
      // During game: highlight current line
      opacity = isCurrentLine ? 0.9 : 0.15;
    } else if (isSelectingStation && hoveredStation) {
      // Initial selection: highlight lines containing hovered station
      opacity = containsHoveredStation ? 1 : 0.15;
      isHighlighted = containsHoveredStation;
    } else if (isSelectingStation && hoveredLine) {
      // Initial selection: highlight hovered line
      opacity = isHoveredLine ? 1 : 0.15;
    }
    
    return (
      <polyline
        key={lineId}
        points={points}
        stroke={color}
        strokeWidth={isHighlighted ? 4 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={opacity}
        style={{ cursor: isSelectingStation ? 'pointer' : 'default', pointerEvents: isSelectingStation ? 'stroke' : 'none' }}
        onMouseEnter={() => isSelectingStation && setHoveredLine(lineId)}
        onMouseLeave={() => isSelectingStation && setHoveredLine(null)}
      />
    );
  };

  const lineRenderOrder = [
    '13-saint-denis', '13-courtilles', '13', '12', '14',
    '7', '7-villejuif', '7-ivry', '7bis', '5', '10', '8', '6', '4', '3', '3bis', '2', '9', '11', '1'
  ];

  const directionLabels = getDirectionLabels();

  // Render roulette wheel
  const renderRoulette = () => {
    const options = rouletteOptions;
    const slotAngle = 360 / options.length;
    
    return (
      <div className="roulette-container">
        <div className="roulette-pointer">▼</div>
        <div 
          className="roulette-wheel"
          style={{ 
            transform: `rotate(${rouletteRotation}deg)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
          }}
        >
          <svg viewBox="0 0 200 200" className="roulette-svg">
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
                    style={{ transform: `rotate(${(startAngle + endAngle) / 2 + 90}deg)`, transformOrigin: `${textX}px ${textY}px` }}
                  >
                    {option.label}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="20" fill="#1a1a2e" stroke="#FFCD00" strokeWidth="3" />
          </svg>
        </div>
        
      </div>
    );
  };

  return (
    <div className="game">
      <header className="game__header">
        <div className="game__title">
          <span className="game__title-line game__title-line--1">M</span>
          <span className="game__title-line game__title-line--4">é</span>
          <span className="game__title-line game__title-line--7">t</span>
          <span className="game__title-line game__title-line--9">r</span>
          <span className="game__title-line game__title-line--11">o</span>
          <span className="game__title-text">Roulette</span>
        </div>
        <p className="game__subtitle">Où va-t-on déposer la petite meuf ?</p>
      </header>

      <div className="game__content">
        <div 
          className="game__map-container"
          ref={mapContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="game__zoom-controls">
            <button onClick={zoomIn} title="Zoom +">+</button>
            <span className="game__zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomOut} title="Zoom -">−</button>
            <button onClick={resetZoom} title="Réinitialiser">⟲</button>
            {currentStation && (
              <button onClick={centerOnStation} title="Centrer sur la station">◎</button>
            )}
          </div>
          
          <svg 
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
            className="game__map"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              cursor: isPanning ? 'grabbing' : (zoom > 1 ? 'grab' : 'default')
            }}
          >
            <rect width="100%" height="100%" fill="#0d1117" />
            
            {/* Paris silhouette - subtle background */}
            <path
              className="game__paris-outline"
              d={`
                M ${latLngToSvg(48.902, 2.28).x} ${latLngToSvg(48.902, 2.28).y}
                C ${latLngToSvg(48.91, 2.32).x} ${latLngToSvg(48.91, 2.32).y}
                  ${latLngToSvg(48.905, 2.38).x} ${latLngToSvg(48.905, 2.38).y}
                  ${latLngToSvg(48.895, 2.41).x} ${latLngToSvg(48.895, 2.41).y}
                C ${latLngToSvg(48.88, 2.42).x} ${latLngToSvg(48.88, 2.42).y}
                  ${latLngToSvg(48.86, 2.42).x} ${latLngToSvg(48.86, 2.42).y}
                  ${latLngToSvg(48.84, 2.415).x} ${latLngToSvg(48.84, 2.415).y}
                C ${latLngToSvg(48.825, 2.40).x} ${latLngToSvg(48.825, 2.40).y}
                  ${latLngToSvg(48.815, 2.38).x} ${latLngToSvg(48.815, 2.38).y}
                  ${latLngToSvg(48.815, 2.35).x} ${latLngToSvg(48.815, 2.35).y}
                C ${latLngToSvg(48.815, 2.32).x} ${latLngToSvg(48.815, 2.32).y}
                  ${latLngToSvg(48.82, 2.28).x} ${latLngToSvg(48.82, 2.28).y}
                  ${latLngToSvg(48.83, 2.25).x} ${latLngToSvg(48.83, 2.25).y}
                C ${latLngToSvg(48.845, 2.235).x} ${latLngToSvg(48.845, 2.235).y}
                  ${latLngToSvg(48.86, 2.23).x} ${latLngToSvg(48.86, 2.23).y}
                  ${latLngToSvg(48.875, 2.24).x} ${latLngToSvg(48.875, 2.24).y}
                C ${latLngToSvg(48.89, 2.25).x} ${latLngToSvg(48.89, 2.25).y}
                  ${latLngToSvg(48.90, 2.27).x} ${latLngToSvg(48.90, 2.27).y}
                  ${latLngToSvg(48.902, 2.28).x} ${latLngToSvg(48.902, 2.28).y}
                Z
              `}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="2"
            />
            
            {/* Seine river - subtle curve */}
            <path
              className="game__seine"
              d={`
                M ${latLngToSvg(48.84, 2.23).x} ${latLngToSvg(48.84, 2.23).y}
                Q ${latLngToSvg(48.855, 2.28).x} ${latLngToSvg(48.855, 2.28).y}
                  ${latLngToSvg(48.865, 2.32).x} ${latLngToSvg(48.865, 2.32).y}
                Q ${latLngToSvg(48.855, 2.35).x} ${latLngToSvg(48.855, 2.35).y}
                  ${latLngToSvg(48.845, 2.38).x} ${latLngToSvg(48.845, 2.38).y}
                Q ${latLngToSvg(48.84, 2.40).x} ${latLngToSvg(48.84, 2.40).y}
                  ${latLngToSvg(48.835, 2.42).x} ${latLngToSvg(48.835, 2.42).y}
              `}
              fill="none"
              stroke="rgba(100, 150, 200, 0.12)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            
            <g className="game__lines">
              {lineRenderOrder.map(lineId => renderLine(lineId))}
            </g>
            
            <g className="game__stations">
              {allStations.map(station => {
                const isCurrentStation = currentStation?.id === station.id;
                const isHovered = hoveredStation?.id === station.id;
                const color = getLineColor(station.lines[0]);
                const radius = station.isInterchange ? 5 : 3;
                
                // Check if station is on current line
                const currentLineStations = currentLine ? lines[currentLine] || [] : [];
                const isOnCurrentLine = currentLineStations.includes(station.id);
                
                // Check if station is on hovered line (for initial selection)
                const hoveredLineStations = hoveredLine ? lines[hoveredLine] || [] : [];
                const isOnHoveredLine = hoveredLineStations.includes(station.id);
                
                // Check if station shares a line with hovered station
                const sharesLineWithHovered = hoveredStation && 
                  station.lines.some(lineId => hoveredStation.lines.includes(lineId));
                
                // Determine if station should be dimmed
                let shouldDim = false;
                if (currentLine) {
                  shouldDim = !isOnCurrentLine && !isCurrentStation;
                } else if (gameState === GAME_STATES.SELECT_STATION && hoveredStation) {
                  shouldDim = !sharesLineWithHovered && !isHovered;
                } else if (gameState === GAME_STATES.SELECT_STATION && hoveredLine) {
                  shouldDim = !isOnHoveredLine;
                }
                
                return (
                  <g 
                    key={station.id} 
                    opacity={shouldDim ? 0.15 : 1}
                    onMouseEnter={() => setHoveredStation(station)}
                    onMouseLeave={() => setHoveredStation(null)}
                  >
                    {isCurrentStation && (
                      <>
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={25}
                          fill={getLineColor(currentLine || station.lines[0])}
                          className="game__station-glow-outer"
                        />
                        <circle
                          cx={station.x}
                          cy={station.y}
                          r={15}
                          fill={getLineColor(currentLine || station.lines[0])}
                          className="game__station-glow"
                        />
                      </>
                    )}
                    
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={isCurrentStation ? 8 : (isHovered ? radius + 2 : radius)}
                      fill={station.isInterchange ? '#ffffff' : color}
                      stroke={station.isInterchange ? color : '#0d1117'}
                      strokeWidth={station.isInterchange ? 2 : 1}
                      className={`game__station ${canSelectStation ? 'game__station--selectable' : ''}`}
                      onClick={() => canSelectStation && handleStationClick(station)}
                      style={{ pointerEvents: canSelectStation ? 'auto' : 'none' }}
                    />
                    
                    {/* Show current station name (not hovered - that's rendered separately on top) */}
                    {isCurrentStation && !isHovered && (
                      <text
                        x={station.x}
                        y={station.y - 15}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        className="game__station-label"
                      >
                        {station.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            
            {/* Hovered station label - rendered last to be on top */}
            {hoveredStation && (
              <g className="game__station-tooltip">
                <rect
                  x={hoveredStation.x - 60}
                  y={hoveredStation.y - 28}
                  width="120"
                  height="20"
                  rx="4"
                  fill="rgba(0, 0, 0, 0.85)"
                />
                <text
                  x={hoveredStation.x}
                  y={hoveredStation.y - 14}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {hoveredStation.name}
                </text>
              </g>
            )}
          </svg>
          
          <div className="game__zoom-hint">
            Molette pour zoomer • Ctrl+clic pour déplacer
          </div>
        </div>

        <div className="game__panel">
          <div className="game__message">{message}</div>
          
          {gameState === GAME_STATES.SELECT_LINE && currentStation && (
            <div className="game__line-select">
              <h3>Choisissez une ligne :</h3>
              <div className="game__line-buttons">
                {getLinesForStation(currentStation.id).map(lineId => {
                  const lineData = getLineData(lineId);
                  return (
                    <button
                      key={lineId}
                      className="game__line-button"
                      style={{ backgroundColor: getLineColor(lineId) }}
                      onClick={() => handleLineSelect(lineId)}
                    >
                      {lineData?.name || lineId}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {gameState === GAME_STATES.SELECT_DIRECTION && (
            <div className="game__direction-select">
              <h3>Choisissez une direction :</h3>
              <div className="game__direction-buttons">
                <button
                  className="game__direction-button"
                  onClick={() => handleDirectionSelect(1)}
                >
                  {directionLabels.forward}
                </button>
                <button
                  className="game__direction-button"
                  onClick={() => handleDirectionSelect(-1)}
                >
                  {directionLabels.backward}
                </button>
              </div>
            </div>
          )}
          
          {(gameState === GAME_STATES.PLAYING || gameState === GAME_STATES.CONFIRM_EXIT || gameState === GAME_STATES.WON) && (
            <div className="game__roulette-area">
              {renderRoulette()}
              
              {gameState === GAME_STATES.PLAYING && (
                <button
                  className="game__spin-button"
                  onClick={spinRoulette}
                  disabled={isSpinning}
                >
                  {isSpinning ? '🎰 Rotation...' : '🎰 Tourner la roulette'}
                </button>
              )}
            </div>
          )}
          
          {gameState === GAME_STATES.CONFIRM_EXIT && (
            <div className="game__confirm-exit">
              <h3>🚪 Sortir ici ?</h3>
              <p className="game__confirm-station">{currentStation?.name}</p>
              <div className="game__confirm-buttons">
                <button
                  className="game__confirm-button game__confirm-button--validate"
                  onClick={() => handleConfirmExit(true)}
                >
                  ✓ Valider la sortie
                </button>
                <button
                  className="game__confirm-button game__confirm-button--continue"
                  onClick={() => handleConfirmExit(false)}
                >
                  → Continuer le voyage
                </button>
              </div>
            </div>
          )}
          
          {gameState === GAME_STATES.WON && (
            <div className="game__win">
              <p>Vous êtes sorti(e) à :</p>
              <div className="game__win-station">{currentStation?.name}</div>
              <p className="game__win-stats">
                {history.filter(h => h.action === 'move').length} stations parcourues
              </p>
            </div>
          )}
          
          {gameState !== GAME_STATES.SELECT_STATION && (
            <button className="game__reset-button" onClick={resetGame}>
              🔄 Nouvelle partie
            </button>
          )}
        </div>
      </div>
      
      {history.length > 0 && (
        <div className="game__journey">
          <div className="game__journey-track">
            {history.map((h, i) => (
              <div key={i} className="game__journey-stop">
                <div className="game__journey-icon">
                  {h.action === 'start' && '🚉'}
                  {h.action === 'move' && '●'}
                  {h.action === 'change' && '🔄'}
                  {h.action === 'reverse' && '↩️'}
                  {h.action === 'exit' && '🚪'}
                </div>
                <div className="game__journey-name">{h.station.name}</div>
                {i < history.length - 1 && <div className="game__journey-line" style={{ backgroundColor: getLineColor(h.line || currentLine) }} />}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations section */}
      {gameState === GAME_STATES.WON && (
        <div className="game__recommendations">
          <h3>🗺️ Explorez les alentours de {currentStation?.name}</h3>
          
          {isLoadingRecommendations && (
            <div className="game__recommendations-loading">
              <div className="game__loading-spinner"></div>
              <p>Recherche des lieux à proximité...</p>
            </div>
          )}
          
          {recommendations && recommendations.places && (
            <div className="game__recommendations-grid">
              {recommendations.places.map((place, i) => (
                <div key={i} className="game__recommendation-card">
                  <div className="game__recommendation-type">
                    {place.type === 'restaurant' && '🍽️'}
                    {place.type === 'monument' && '🏛️'}
                    {place.type === 'musée' && '🎨'}
                    {place.type === 'parc' && '🌳'}
                    {place.type === 'shopping' && '🛍️'}
                    {place.type === 'café' && '☕'}
                    {place.type === 'bar' && '🍸'}
                    {place.type === 'autre' && '📌'}
                    {' '}{place.type}
                  </div>
                  <h4 className="game__recommendation-name">{place.name}</h4>
                  <p className="game__recommendation-desc">{place.description}</p>
                  {place.address && (
                    <p className="game__recommendation-address">📍 {place.address}</p>
                  )}
                  {place.address && (
                    <a 
                      href={getGoogleMapsDirectionsUrl(place.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="game__recommendation-link"
                    >
                      🚶 Itinéraire à pied
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
