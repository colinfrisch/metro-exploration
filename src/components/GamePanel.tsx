import Roulette from './Roulette';
import type { Station, Line, HistoryEntry, GameState } from '../types';
import '../styles/GamePanel.css';

interface GamePanelProps {
  gameState: GameState;
  message: string;
  currentStation: Station | null;
  availableLines: string[];
  directionLabels: { forward: string; backward: string };
  hasCorrespondence: boolean;
  rouletteRotation: number;
  isSpinning: boolean;
  selectedSlot: number | null;
  history: HistoryEntry[];
  onLineSelect: (lineId: string) => void;
  onDirectionSelect: (direction: number) => void;
  onSpin: () => void;
  onConfirmExit: (confirmed: boolean) => void;
  onReset: () => void;
  getLineColor: (lineId: string) => string;
  getLineData: (lineId: string) => Line | undefined;
}

export default function GamePanel({
  gameState,
  message,
  currentStation,
  availableLines,
  directionLabels,
  hasCorrespondence,
  rouletteRotation,
  isSpinning,
  selectedSlot,
  history,
  onLineSelect,
  onDirectionSelect,
  onSpin,
  onConfirmExit,
  onReset,
  getLineColor,
  getLineData
}: GamePanelProps) {
  const STATES: Record<GameState, GameState> = {
    SELECT_STATION: 'SELECT_STATION',
    SELECT_LINE: 'SELECT_LINE',
    SELECT_DIRECTION: 'SELECT_DIRECTION',
    PLAYING: 'PLAYING',
    CONFIRM_EXIT: 'CONFIRM_EXIT',
    WON: 'WON'
  };

  return (
    <div className="panel">
      <div className="panel__message">{message}</div>
      
      {/* Line Selection */}
      {gameState === STATES.SELECT_LINE && currentStation && (
        <div className="panel__section">
          <h3>Choisissez une ligne :</h3>
          <div className="panel__buttons">
            {availableLines.map(lineId => {
              const lineData = getLineData(lineId);
              return (
                <button
                  key={lineId}
                  className="panel__line-button"
                  style={{ backgroundColor: getLineColor(lineId) }}
                  onClick={() => onLineSelect(lineId)}
                >
                  {lineData?.name || lineId}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Direction Selection */}
      {gameState === STATES.SELECT_DIRECTION && (
        <div className="panel__section">
          <h3>Choisissez une direction :</h3>
          <div className="panel__buttons">
            <button className="panel__direction-button" onClick={() => onDirectionSelect(1)}>
              {directionLabels.forward}
            </button>
            <button className="panel__direction-button" onClick={() => onDirectionSelect(-1)}>
              {directionLabels.backward}
            </button>
          </div>
        </div>
      )}
      
      {/* Roulette Area */}
      {(gameState === STATES.PLAYING || gameState === STATES.CONFIRM_EXIT || gameState === STATES.WON) && (
        <div className="panel__roulette">
          <Roulette
            hasCorrespondence={hasCorrespondence}
            rotation={rouletteRotation}
            isSpinning={isSpinning}
            selectedSlot={selectedSlot}
            onSpin={gameState === STATES.PLAYING ? onSpin : null}
            disabled={isSpinning}
          />
        </div>
      )}
      
      {/* Exit Confirmation */}
      {gameState === STATES.CONFIRM_EXIT && (
        <div className="panel__confirm-exit">
          <h3>🚪 Sortir ici ?</h3>
          <p className="panel__confirm-station">{currentStation?.name}</p>
          <div className="panel__confirm-buttons">
            <button
              className="panel__confirm-button panel__confirm-button--validate"
              onClick={() => onConfirmExit(true)}
            >
              ✓ Valider la sortie
            </button>
            <button
              className="panel__confirm-button panel__confirm-button--continue"
              onClick={() => onConfirmExit(false)}
            >
              → Continuer le voyage
            </button>
          </div>
        </div>
      )}
      
      {/* Win Screen */}
      {gameState === STATES.WON && (
        <div className="panel__win">
          <p>Vous êtes sorti(e) à :</p>
          <div className="panel__win-station">{currentStation?.name}</div>
          <p className="panel__win-stats">
            {history.filter(h => h.action === 'move').length} stations parcourues
          </p>
        </div>
      )}
      
      {/* Reset Button */}
      {gameState !== STATES.SELECT_STATION && (
        <button className="panel__reset-button" onClick={onReset}>
          🔄 Nouvelle partie
        </button>
      )}
    </div>
  );
}
